<?php

declare(strict_types=1);

namespace Drupal\kmfri_enterprise\Twig;

use Drupal\Component\Utility\Html;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;
use Drupal\kmfri_enterprise\Repository\Catalogue;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

/**
 * Twig helpers for the hub templates.
 *
 * - kmfri_icon('search', 'w-4 h-4'): inline SVG from the module icon sprite.
 * - kmfri_asset('images/x.webp'): URL of a file shipped with the module.
 * - kmfri_srcset('images/x.webp'): "x-sm.webp 760w, x.webp 1376w" when a small variant exists.
 * - kmfri_catalogue_url('laboratory/water'): web address of a catalogue node ('' = catalogue).
 * - kmfri_service_url('educational-visits'): catalogue page presenting a service portfolio.
 * - kmfri_station_url(station): a research station's own page (/enterprise/stations/{slug}).
 * - |kes: thousands-separated amount ("190,000").
 * - |kmfri_fee: display tariff of a catalogue item ("Ksh 1,500 per sample", "Free").
 */
final class HubTwigExtension extends AbstractExtension {

  private ?string $modulePath = NULL;

  public function __construct(
    private readonly ModuleExtensionList $moduleList,
    private readonly FileUrlGeneratorInterface $fileUrlGenerator,
    private readonly Catalogue $catalogue,
  ) {}

  public function getFunctions(): array {
    return [
      new TwigFunction('kmfri_icon', [$this, 'icon']),
      new TwigFunction('kmfri_asset', [$this, 'asset']),
      new TwigFunction('kmfri_srcset', [$this, 'srcset']),
      new TwigFunction('kmfri_small', [$this, 'small']),
      new TwigFunction('kmfri_catalogue_url', [Catalogue::class, 'url']),
      new TwigFunction('kmfri_service_url', [$this->catalogue, 'serviceUrl']),
      new TwigFunction('kmfri_station_url', static fn (array $station) => Url::fromRoute('kmfri_enterprise.station', ['station' => Catalogue::stationSlug($station)])->toString()),
    ];
  }

  public function getFilters(): array {
    return [
      new TwigFilter('kes', static fn ($amount) => number_format((float) $amount)),
      new TwigFilter('kmfri_fee', [Catalogue::class, 'fee']),
    ];
  }

  /**
   * Decorative icon (aria-hidden) referencing the sprite symbol "i-{name}".
   */
  public function icon(string $name, string $class = ''): Markup {
    $sprite = $this->asset('images/icons.svg') . '?v=1';
    $classes = trim('k-ic ' . $class);
    return Markup::create(sprintf(
      '<svg class="%s" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="%s#i-%s"></use></svg>',
      Html::escape($classes),
      Html::escape($sprite),
      Html::escape($name)
    ));
  }

  public function asset(string $path): string {
    return $this->fileUrlGenerator->generateString($this->path() . '/' . ltrim($path, '/'));
  }

  /**
   * Small (760px) variant of an image when one ships with the module.
   */
  public function small(string $path): string {
    $small = preg_replace('/\.webp$/', '-sm.webp', ltrim($path, '/'));
    return $this->asset(is_file($this->path() . '/' . $small) ? $small : $path);
  }

  public function srcset(string $path): ?string {
    $path = ltrim($path, '/');
    $small = preg_replace('/\.webp$/', '-sm.webp', $path);
    if ($small === $path || !is_file($this->path() . '/' . $small)) {
      return NULL;
    }
    return $this->asset($small) . ' 760w, ' . $this->asset($path) . ' 1376w';
  }

  private function path(): string {
    return $this->modulePath ??= $this->moduleList->getPath('kmfri_enterprise');
  }

}
