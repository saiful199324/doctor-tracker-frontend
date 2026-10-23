import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError, errorMessage } from './api';

/** Maps the API's `{ errors: { field: [msg] } }` onto form fields; anything else becomes a toast. */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: string[]) {
  if (error instanceof ApiError && error.errors) {
    let mapped = false;
    for (const [field, messages] of Object.entries(error.errors)) {
      if (fields.includes(field)) {
        setError(field as Path<T>, { type: 'server', message: messages[0] });
        mapped = true;
      }
    }
    if (mapped) return;
  }
  toast.error(errorMessage(error));
}
