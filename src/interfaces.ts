import { RemoteInfo } from "dgram";

interface GenericMessage<T = string> {
  type: T;
  author: string;
}

export interface Connect extends GenericMessage<"connect"> {}
export interface MessageServer extends GenericMessage<"message"> {
  message: string;
}
export interface Disconnect extends GenericMessage<"disconnect"> {}

export type AnyMessageServer = Connect | MessageServer | Disconnect;

export interface ConnectionSuccessful
  extends GenericMessage<"conectionSuccessful"> {
  address: string;
  port: number;
}

export interface MessageClient extends GenericMessage<"message"> {
  message: string;
}

export type AnyMessageClient = ConnectionSuccessful | MessageClient;

export interface Client extends RemoteInfo {
  author: string;
}
