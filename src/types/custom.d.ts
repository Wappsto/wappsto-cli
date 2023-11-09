export type Permission = {
  create?: string[];
  permit_to_send_email?: boolean;
  permit_to_send_sms?: boolean;
  [k: string]: unknown;
};

export type Description = {
  general?: string;
  foreground?: string;
  background?: string;
  widget?: string;
  version?: string;
};

export type SupportedFeatures = ('foreground' | 'background' | 'widget')[];

export type Manifest = {
  name: string;
  name_identifier: string;
  author: string;
  version_app: string;
  max_number_installation: number;
  supported_features: SupportedFeatures;
  description: Description;
  permission: Permission;
};

type JsonObjType = Record<
  string,
  JsonObjType | string | string[] | JsonObjType[] | number | boolean
>;

export type Limitation = {
  comparator: '=' | '==' | '!=' | '<=' | '<' | '>' | '>=' | '~' | '!~';
  attribute: string;
  value: string[];
  type: 'network' | 'device' | 'value' | 'state';
};

export type Request = {
  method: string[];
  collection: string[];
  message: string;
  data?: JsonObjType[];
  name_installation: string;
  type: string;
  quantity?: 'all' | number;
  new_limitation?: Record<string, Limitation[]>;
};

export type StreamCallbackEvent = {
  id?: string | undefined;
  application?: string | undefined;
  installation?: string | undefined;
  status?: string | undefined;
  session?: boolean | undefined;
  log?: string | undefined;
  warn?: string | undefined;
  error?: string | undefined;
  type?: string | undefined;
  timestamp?: string | undefined;
  req?: Request | undefined;
  reinstall?: boolean | undefined;
  action?: string | undefined;

  [k: string]: string | boolean | Request | undefined;
};
