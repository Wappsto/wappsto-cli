/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Application21 {
  last_published?: string;
  last_committed?: string;
  name: string;
  installation?: string[];
  published_version?: {
    version_app?: string;
    author?: string;
    session_user?: boolean;
    native?: boolean;
    uninstallable?: boolean;
    max_number_installation?: number;
    supported_features?: ("foreground" | "background" | "widget")[];
    description?: {
      general?: string;
      foreground?: string;
      background?: string;
      widget?: string;
      version?: string;
    };
  };
  name_identifier?: string;
  published?: boolean;
  permit_free?: boolean;
  installed?: {
    last_update?: string;
    quantity?: number;
    [k: string]: unknown;
  };
  meta: Meta21;
  version: (Version21 | string)[];
  /**
   * @maxItems 1
   */
  oauth_client: [] | [OauthClient21 | string];
  oauth_external: (OauthExternal21 | string)[];
  application_product: (ApplicationProduct21 | string)[];
}
export interface Meta21 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ("unassigned" | "admin")) & string;
  owner?: (string | ("unassigned" | "admin")) & string;
  created?: (string | "not_available") & string;
  updated?: (string | "not_available") & string;
  changed?: (string | "not_available") & string;
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
export interface Version21 {
  name: string;
  name_identifier?: string;
  application?: string;
  author?: string;
  version_app?: string;
  commit?: string;
  title?: string;
  session_user?: boolean;
  concern?: string;
  native?: boolean;
  name_folder?: string;
  icon?: string;
  priority?: number;
  time_commit?: string;
  version_to_clone?: string;
  installation?: string[];
  uninstallable?: boolean;
  published?: boolean;
  executable?: {
    engine?: "node" | "python";
    version?: string;
  };
  max_number_installation?: number;
  object_requested?: {
    [k: string]: unknown;
  };
  supported_features?: ("foreground" | "background" | "widget")[];
  description?: {
    general?: string;
    foreground?: string;
    background?: string;
    widget?: string;
    version?: string;
  };
  status:
    | "idle"
    | "commit"
    | "revision"
    | "publish"
    | "uncommit"
    | "unpublish"
    | "republish"
    | "disable"
    | "reenable"
    | "duplicate"
    | "pending"
    | "uncommitted"
    | "published"
    | "not updated"
    | "unpublished"
    | "disabled";
  used_files: {
    [k: string]: unknown;
  };
  installed?: {
    last_update?: string;
    quantity?: number;
    [k: string]: unknown;
  };
  meta: Meta211;
  permission?: {
    create?: string[];
    permit_to_send_email?: boolean;
    permit_to_send_sms?: boolean;
    [k: string]: unknown;
  };
  file?: (File21 | string)[];
}
export interface Meta211 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ("unassigned" | "admin")) & string;
  owner?: (string | ("unassigned" | "admin")) & string;
  created?: (string | "not_available") & string;
  updated?: (string | "not_available") & string;
  changed?: (string | "not_available") & string;
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
  last_committed?: string;
  last_published?: string;
}
export interface File21 {
  name: string;
  type?: string;
  size?: number;
  published?: boolean;
  concernFile?: {
    timestamp: string;
    /**
     * @minItems 1
     */
    concern: [
      {
        concern: string;
        line: number;
      },
      ...{
        concern: string;
        line: number;
      }[]
    ];
  }[];
  meta: Meta212;
}
export interface Meta212 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ("unassigned" | "admin")) & string;
  owner?: (string | ("unassigned" | "admin")) & string;
  created?: (string | "not_available") & string;
  updated?: (string | "not_available") & string;
  changed?: (string | "not_available") & string;
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
export interface OauthClient21 {
  name: string;
  company?: string;
  description?: string;
  homepage_url?: string;
  expires?: number;
  client_id: string;
  client_secret?: string;
  redirect_uri?: string[];
  path_access_token?: string[];
  application_id: string;
  installation_id: string[];
  meta: Meta213;
  external?: {
    name: string;
    api_key: string;
    api_secret_key: string;
    api_site: string;
  }[];
}
export interface Meta213 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ("unassigned" | "admin")) & string;
  owner?: (string | ("unassigned" | "admin")) & string;
  created?: (string | "not_available") & string;
  updated?: (string | "not_available") & string;
  changed?: (string | "not_available") & string;
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
export interface OauthExternal21 {
  name: string;
  description?: string;
  api_callback?: string;
  api_key: string;
  api_secret_key?: string;
  api_site: string;
  api_extra_request?: {
    [k: string]: unknown;
  };
  api_extra_request_required?: string[];
  api_extra_access_token?: {
    [k: string]: unknown;
  };
  access_token_method?: "get" | "post";
  application_id?: string;
  oauth_version: "1.0" | "1.0a" | "2.0";
  oauth_request_token_url?: string;
  oauth_access_token_url?: string;
  oauth_refresh_access_token_url?: string;
  api_extra_refresh_access_token?: {
    [k: string]: unknown;
  };
  refresh_access_token_method?: "get" | "post";
  meta: Meta214;
}
export interface Meta214 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ("unassigned" | "admin")) & string;
  owner?: (string | ("unassigned" | "admin")) & string;
  created?: (string | "not_available") & string;
  updated?: (string | "not_available") & string;
  changed?: (string | "not_available") & string;
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
export interface ApplicationProduct21 {
  meta?: Meta215;
  name?: string;
  description?: string;
  active?: boolean;
  deleted?: boolean;
  stripe?: {
    [k: string]: unknown;
  };
  type?: "one_time" | "subscription";
  currency?: string;
  amount?: number;
  recurring?: {
    interval: "day" | "week" | "month" | "year";
    interval_count: number;
  };
  tax?: {
    id?: string;
    prices_with_tax?: {
      amount?: number;
      prepaid_extra_cost?: number;
      topup_extra_cost?: number;
      [k: string]: unknown;
    };
    prices_without_tax?: {
      amount?: number;
      prepaid_extra_cost?: number;
      topup_extra_cost?: number;
      [k: string]: unknown;
    };
    name?: string;
    description?: string;
    jurisdiction?: string;
    inclusive?: boolean;
    percentage?: number;
    state?: string;
    [k: string]: unknown;
  };
  trial_period_days?: number;
}
export interface Meta215 {
  id?: string;
  type?: string;
  version?: string;
  manufacturer?: (string | ("unassigned" | "admin")) & string;
  owner?: (string | ("unassigned" | "admin")) & string;
  created?: (string | "not_available") & string;
  updated?: (string | "not_available") & string;
  changed?: (string | "not_available") & string;
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
