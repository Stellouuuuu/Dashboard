import type { TFunction } from 'i18next';
import { prettifyWidgetName } from '../data/catalog';

/** Nom affiché d'un widget — clé i18n par id, repli sur le nom formaté depuis le registre. */
export function widgetName(t: TFunction, id: string): string {
  return t(`widgets.${id}.name`, { defaultValue: prettifyWidgetName(id) });
}

/** Description d'un widget — clé i18n par id, repli sur le texte du registre back. */
export function widgetDescription(t: TFunction, id: string, registryText: string): string {
  return t(`widgets.${id}.description`, { defaultValue: registryText });
}

/** Libellé d'un paramètre de widget — clé i18n par id+param, repli sur le libellé du registre back. */
export function widgetParamLabel(t: TFunction, id: string, paramName: string, registryLabel: string): string {
  return t(`widgets.${id}.params.${paramName}`, { defaultValue: registryLabel });
}
