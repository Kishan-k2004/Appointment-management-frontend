import { onBeforeUnmount, ref, shallowRef } from 'vue';
import { isCancelledRequest } from '@/services/api';

/**
 * Runs an async loader with loading/error state. Starting a new run aborts the
 * previous in-flight request, so a slow old response can never overwrite newer
 * data (e.g. when paging quickly or typing in search).
 *
 * @param {(signal: AbortSignal) => Promise<any>} loader
 */
export function useRequest(loader, { initialData = null } = {}) {
  const data = shallowRef(initialData);
  const loading = ref(false);
  const error = ref(null);
  let controller = null;

  async function run() {
    controller?.abort();
    const current = new AbortController();
    controller = current;
    loading.value = true;
    error.value = null;
    try {
      data.value = await loader(current.signal);
    } catch (err) {
      if (isCancelledRequest(err) || current.signal.aborted) return;
      error.value = err;
    } finally {
      if (controller === current) loading.value = false;
    }
  }

  onBeforeUnmount(() => controller?.abort());

  return { data, loading, error, run };
}
