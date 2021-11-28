interface GenericMessage<T = string> {
  type: T;
  auth: string;
}

export interface Connect extends GenericMessage<"connect"> {}
export interface Message extends GenericMessage<"message"> {
  message: string;
}
export interface Disconnect extends GenericMessage<"disconnect"> {}

export type AnyMessage = Connect | Message | Disconnect;
