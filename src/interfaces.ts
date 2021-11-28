interface GenericMessage<T = string> {
  type: T;
}

export interface Connect extends GenericMessage<"connect"> {
  author: string;
}
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
