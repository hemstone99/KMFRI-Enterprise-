<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\kmfri_enterprise\Repository\AdminRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Moves a quotation request to its next workflow status.
 */
final class InquiryStatusForm extends FormBase {

  /**
   * Not readonly: forms are serialized into the form cache.
   */
  public function __construct(protected AdminRepository $admin) {}

  public static function create(ContainerInterface $container): static {
    return new static($container->get('kmfri_enterprise.admin_repository'));
  }

  public function getFormId(): string {
    return 'kmfri_enterprise_inquiry_status';
  }

  public function buildForm(array $form, FormStateInterface $form_state, ?array $inquiry = NULL): array {
    $form_state->set('inquiry_id', (int) $inquiry['id']);
    $next = AdminRepository::nextStatuses($inquiry['status']);
    $form['#attributes']['class'][] = 'k-form';

    if (!$next) {
      $form['closed'] = [
        '#markup' => '<p class="text-sm text-muted">' . $this->t('This request is %status; no further workflow steps.', [
          '%status' => AdminRepository::STATUSES[$inquiry['status']],
        ]) . '</p>',
      ];
      return $form;
    }

    $form['status'] = [
      '#type' => 'select',
      '#title' => $this->t('Move to'),
      '#options' => array_intersect_key(AdminRepository::STATUSES, array_flip($next)),
      '#default_value' => $next[0],
      '#required' => TRUE,
      '#attributes' => ['class' => ['k-input']],
      '#label_attributes' => ['class' => ['k-label']],
    ];
    $form['remarks'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Remarks for the audit trail'),
      '#rows' => 3,
      '#maxlength' => 2000,
      '#description' => $this->t('Required when cancelling.'),
      '#attributes' => ['class' => ['k-input'], 'placeholder' => $this->t('e.g. Quotation issued with 14-day validity')],
      '#label_attributes' => ['class' => ['k-label']],
    ];
    $form['actions'] = ['#type' => 'actions'];
    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Update status'),
      '#attributes' => ['class' => ['btn', 'btn-primary', 'btn-sm']],
    ];
    return $form;
  }

  public function validateForm(array &$form, FormStateInterface $form_state): void {
    if ($form_state->getValue('status') === 'cancelled' && trim((string) $form_state->getValue('remarks')) === '') {
      $form_state->setErrorByName('remarks', $this->t('Give a reason for cancelling this request.'));
    }
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $id = (int) $form_state->get('inquiry_id');
    $status = (string) $form_state->getValue('status');
    $by = $this->currentUser()->getDisplayName();
    try {
      $this->admin->updateStatus($id, $status, $by, trim((string) $form_state->getValue('remarks')));
    }
    catch (\InvalidArgumentException) {
      $this->messenger()->addError($this->t('That status change is no longer allowed; the request may have been updated by someone else.'));
      return;
    }
    catch (\Throwable $e) {
      $this->logger('kmfri_enterprise')->error('Inquiry @id status update failed: @m', ['@id' => $id, '@m' => $e->getMessage()]);
      $this->messenger()->addError($this->t('The status could not be updated. Please try again.'));
      return;
    }
    $reference = $this->admin->inquiry($id)['reference_number'] ?? (string) $id;
    $this->logger('kmfri_enterprise')->notice('Inquiry @ref moved to @status by @user.', [
      '@ref' => $reference,
      '@status' => AdminRepository::STATUSES[$status],
      '@user' => $by,
    ]);
    $this->messenger()->addStatus($this->t('@ref is now %status.', ['@ref' => $reference, '%status' => AdminRepository::STATUSES[$status]]));
  }

}
