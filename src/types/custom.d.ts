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

type Limitation = {
  comparator: '=' | '==' | '!=' | '<=' | '<' | '>' | '>=' | '~' | '!~';
  attribute: string;
  value: string[];
  type: 'network' | 'device' | 'value' | 'state';
};
