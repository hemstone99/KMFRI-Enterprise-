<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\EventSubscriber;

use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Url;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Sends logged-out visitors of the dashboard to the login form, then back.
 *
 * Logged-in users without the dashboard permission still get the normal
 * "access denied" page.
 */
final class DashboardLoginRedirect implements EventSubscriberInterface {

  public function __construct(
    private readonly AccountInterface $currentUser,
    private readonly RouteMatchInterface $routeMatch,
  ) {}

  public static function getSubscribedEvents(): array {
    // Before core's exception subscribers render the 403 page.
    return [KernelEvents::EXCEPTION => ['onException', 100]];
  }

  public function onException(ExceptionEvent $event): void {
    if (!$event->getThrowable() instanceof AccessDeniedHttpException || $this->currentUser->isAuthenticated()) {
      return;
    }
    $route = (string) $this->routeMatch->getRouteName();
    if (!str_starts_with($route, 'kmfri_enterprise.admin.') || $route === 'kmfri_enterprise.admin.inquiries_export') {
      return;
    }
    $request = $event->getRequest();
    $destination = $request->getPathInfo() . ($request->getQueryString() ? '?' . $request->getQueryString() : '');
    $login = Url::fromRoute('user.login', [], ['query' => ['destination' => $destination]])->toString();
    $event->setResponse(new RedirectResponse($login));
  }

}
