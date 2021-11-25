import log from 'loglevel';

import {KUSTOMIZATION_KIND} from '@constants/constants';

import {loadResource} from '@redux/services';

import {getResourceKindHandler} from '@src/kindhandlers';

const k8sSchema = JSON.parse(loadResource('schemas/k8sschemas.json'));
const kustomizeSchema = JSON.parse(loadResource('schemas/kustomization.json'));
const schemaCache = new Map<string, any>();

/**
 * Returns a JSON Schema for the specified resource kind
 */
export function getResourceSchema(resourceKind: string) {
  if (resourceKind === KUSTOMIZATION_KIND) {
    return kustomizeSchema;
  }

  const resourceKindHandler = getResourceKindHandler(resourceKind);
  const prefix = resourceKindHandler?.validationSchemaPrefix;

  if (prefix) {
    const schemaKey = `${prefix}.${resourceKind}`;
    if (!schemaCache.has(schemaKey)) {
      const kindSchema = k8sSchema['definitions'][schemaKey];
      if (kindSchema) {
        Object.keys(k8sSchema).forEach(key => {
          if (key !== 'definitions') {
            delete k8sSchema[key];
          }
        });

        Object.keys(kindSchema).forEach(key => {
          k8sSchema[key] = JSON.parse(JSON.stringify(kindSchema[key]));
        });

        schemaCache.set(schemaKey, JSON.parse(JSON.stringify(k8sSchema)));
      }
    }

    if (schemaCache.has(schemaKey)) {
      return schemaCache.get(schemaKey);
    }
  }

  log.warn(`Failed to find schema for resource of kind ${resourceKind}`);
  return undefined;
}
