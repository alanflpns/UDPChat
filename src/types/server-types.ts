/* -------------------------------------------------------------------------- */
/*                                Server Types                                */
/* -------------------------------------------------------------------------- */

import { Client, GenericMessage } from "./types";

export interface ConnectionSuccessful
  extends GenericMessage<"conectionSuccessful"> {
  client: Client;
}

export interface MessageServer extends GenericMessage<"message"> {
  client: Client;
  message: string;
}

export interface ListUsers extends GenericMessage<"list-users"> {
  clients: Client[];
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
  | DisconnectClients
  | ListUsers;
