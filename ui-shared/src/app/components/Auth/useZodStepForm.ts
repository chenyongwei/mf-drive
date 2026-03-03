import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormProps,
} from 'react-hook-form';
import type { ZodTypeAny } from 'zod';

interface UseZodStepFormOptions<T extends FieldValues> {
  schema: ZodTypeAny;
  defaultValues: DefaultValues<T>;
  mode?: UseFormProps<T>['mode'];
}

export function useZodStepForm<T extends FieldValues>({
  schema,
  defaultValues,
  mode,
}: UseZodStepFormOptions<T>) {
  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  });
}
