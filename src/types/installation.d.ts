/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Installation21 {
  application: string;
  version_id: string;
  title?: string;
  name?: string;
  author?: string;
  supported_features: string[];
  version_app?: string;
  session_user: boolean;
  native?: boolean;
  name_folder?: string;
  icon?: string;
  uninstallable?: boolean;
  upgrade?: boolean;
  ignore_this_notification?: string[];
  token_installation: string;
  extsync: boolean;
  permit_to_send_email?: boolean;
  permit_to_send_sms?: boolean;
  session?: string;
  background_session?: string;
  status: {
    background?:
      | 'no_background'
      | 'pending'
      | 'not_paid'
      | 'running'
      | 'crashed'
      | 'restarting'
      | 'error'
      | 'failed'
      | 'stopped'
      | 'completed'
      | 'no_more_points';
    version?: 'uninstalled' | 'not updated' | 'disabled' | 'updated' | 'editor';
    payment?: 'free' | 'owned' | 'pending' | 'paid' | 'not_paid';
  };
  description?: {
    general?: string;
    foreground?: string;
    background?: string;
    widget?: string;
    version?: string;
  };
  payment: {
    free?: boolean;
    status?: string;
    application_product_id?: string;
    created?: string;
    current_period_end?: string;
    current_period_start?: string;
    pending?: {
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  meta: Meta21;
  oauth: (Oauth21 | string)[];
  oauth_connect: (OauthConnect21 | string)[];
}
export interface Meta21 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ('unassigned' | 'admin')) & string;
  owner?: (string | ('unassigned' | 'admin')) & string;
  created?: (string | 'not_available') & string;
  updated?: (string | 'not_available') & string;
  changed?: (string | 'not_available') & string;
  application?: string;
  revision?: number;
  trace?: string;
  oem?: string;
  deprecated?: boolean;
  redirect?: string;
  size?: number;
  path?: string;
  parent?: string;
  error?: {
    [k: string]: unknown;
  };
  icon?: string;
  tag?: string[];
  tag_by_user?: string[];
  name_by_user?: string;
  warning?: {
    message?: string;
    data?: {
      [k: string]: unknown;
    };
    code?: number;
    [k: string]: unknown;
  }[];
  parent_name?: {
    [k: string]: unknown;
  };
  read_only?: boolean;
  original_id?: string;
  alert?: string[];
  contract?: string[];
}
export interface Oauth21 {
  client_id: string;
  name?: string;
  expires?: boolean;
  expired: boolean;
  active: boolean;
  installation_id: string;
  meta: Meta211;
}
export interface Meta211 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ('unassigned' | 'admin')) & string;
  owner?: (string | ('unassigned' | 'admin')) & string;
  created?: (string | 'not_available') & string;
  updated?: (string | 'not_available') & string;
  changed?: (string | 'not_available') & string;
  application?: string;
  revision?: number;
  trace?: string;
  oem?: string;
  deprecated?: boolean;
  redirect?: string;
  size?: number;
  path?: string;
  parent?: string;
  error?: {
    [k: string]: unknown;
  };
  icon?: string;
  tag?: string[];
  tag_by_user?: string[];
  name_by_user?: string;
  warning?: {
    message?: string;
    data?: {
      [k: string]: unknown;
    };
    code?: number;
    [k: string]: unknown;
  }[];
  parent_name?: {
    [k: string]: unknown;
  };
  read_only?: boolean;
  original_id?: string;
  alert?: string[];
  contract?: string[];
}
export interface OauthConnect21 {
  name?: string;
  api: string;
  installation: string;
  token: string;
  secret_token?: string;
  params?: {
    [k: string]: unknown;
  };
  meta: Meta212;
  access_token_creation?: {
    [k: string]: unknown;
  };
}
export interface Meta212 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ('unassigned' | 'admin')) & string;
  owner?: (string | ('unassigned' | 'admin')) & string;
  created?: (string | 'not_available') & string;
  updated?: (string | 'not_available') & string;
  changed?: (string | 'not_available') & string;
  application?: string;
  revision?: number;
  trace?: string;
  oem?: string;
  deprecated?: boolean;
  redirect?: string;
  size?: number;
  path?: string;
  parent?: string;
  error?: {
    [k: string]: unknown;
  };
  icon?: string;
  tag?: string[];
  tag_by_user?: string[];
  name_by_user?: string;
  warning?: {
    message?: string;
    data?: {
      [k: string]: unknown;
    };
    code?: number;
    [k: string]: unknown;
  }[];
  parent_name?: {
    [k: string]: unknown;
  };
  read_only?: boolean;
  original_id?: string;
  alert?: string[];
  contract?: string[];
}
