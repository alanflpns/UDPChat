/* -------------------------------------------------------------------------- */
/*                                Client types                                */
/* -------------------------------------------------------------------------- */

import { GenericMessage } from "./types";

export interface Connect extends GenericMessage<"connect"> {
  author: string;
}

export interface ListUsers extends GenericMessage<"list-users"> {}

export interface MessageClient extends GenericMessage<"message"> {
  message: string;
}
export interface DisconnectFromServer extends GenericMessage<"disconnect"> {}

export type ClientMessage =
  | Connect
  | MessageClient
  | DisconnectFromServer
  | ListUsers;
