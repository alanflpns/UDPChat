/* -------------------------------------------------------------------------- */
/*                                Server Types                                */
/* -------------------------------------------------------------------------- */

import { Client, GenericMessage } from "./types";

export interface OpenedChat {
  startedAt: Date;
  clients: Client[];
  id: string;
}

export interface ConnectionSuccessful
  extends GenericMessage<"connection-successful"> {
  client: Client;
}

export interface MessageServer extends GenericMessage<"message"> {
  client: Client;
  message: string;
}

export interface ListUsers extends GenericMessage<"list-users"> {
  clients: Client[];
}

export interface StartChat extends GenericMessage<"start-chat"> {
  chat: OpenedChat;
}

export interface NewConnection extends GenericMessage<"new-connection"> {
  client: Client;
}

export interface DisconnectClients extends GenericMessage<"disconnect"> {
  client: Client;
}

export interface ServerError extends GenericMessage<"server-error"> {
  message: string;
}

export type ServerMessage =
  | ConnectionSuccessful
  | MessageServer
  | NewConnection
  | DisconnectClients
  | ListUsers
  | StartChat
  | ServerError;
