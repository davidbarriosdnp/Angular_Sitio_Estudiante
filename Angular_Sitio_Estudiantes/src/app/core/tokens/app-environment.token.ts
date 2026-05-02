import { InjectionToken } from '@angular/core';
import type { AppEnvironment } from '../../../environments/environment.interface';

export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');
