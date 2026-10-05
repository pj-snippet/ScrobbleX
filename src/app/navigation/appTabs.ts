export type AppTab =
  | 'home'
  | 'activity'
  | 'charts'
  | 'timeline'
  | 'profile'
  | 'rediscover'
  | 'history'
  | 'loved'
  | 'integrity'
  | 'settings';

export type PrimaryAppTab = Extract<AppTab, 'home' | 'activity' | 'charts' | 'timeline' | 'profile'>;
