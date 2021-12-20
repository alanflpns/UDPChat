import { RemoteInfo } from "dgram";

/* -------------------------------------------------------------------------- */
/*                                Generic Types                               */
/* -------------------------------------------------------------------------- */
export interface Client extends RemoteInfo {
  author: string;
}

export interface GenericMessage<T = string> {
  type: T;
}
