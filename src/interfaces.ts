interface GenericMessage<T = string> {
  type: T;
}

export interface Connect extends GenericMessage<"connect"> {
  author: string;
}
export interface Message extends GenericMessage<"message"> {
  message: string;
}
export interface Disconnect extends GenericMessage<"disconnect"> {}

export type AnyMessage = Connect | Message | Disconnect;

export interface ConnectionSuccessful extends GenericMessage<'conectionSuccessful'> {
  address: string;
  port: number;
}
