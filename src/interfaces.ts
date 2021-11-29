import { RemoteInfo } from "dgram";

/* -------------------------------------------------------------------------- */
/*                                Generic Types                               */
/* -------------------------------------------------------------------------- */
export interface Client extends RemoteInfo {
  author: string;
}

interface GenericMessage<T = string> {
  type: T;
}

/* -------------------------------------------------------------------------- */
/*                                Client types                                */
/* -------------------------------------------------------------------------- */

export interface Connect extends GenericMessage<"connect"> {
  author: string;
}

export interface MessageClient extends GenericMessage<"message"> {
  message: string;
}
export interface DisconnectFromServer extends GenericMessage<"disconnect"> {}

export type ClientMessage = Connect | MessageClient | DisconnectFromServer;

/* -------------------------------------------------------------------------- */
/*                                Server Types                                */
/* -------------------------------------------------------------------------- */

export interface ConnectionSuccessful
  extends GenericMessage<"conectionSuccessful"> {
  client: Client;
}

export interface MessageServer extends GenericMessage<"message"> {
  client: Client;
  message: string;
}

export interface NewConnection extends GenericMessage<"newConnection"> {
  client: Client;
}

export interface DisconnectClients extends GenericMessage<"disconnect"> {
  client: Client;
}

export type ServerMessage =
  | ConnectionSuccessful
  | MessageServer
  | NewConnection
  | DisconnectClients;
