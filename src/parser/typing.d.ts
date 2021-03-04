import {CONSTANT_TAG} from "./constants";

export interface UItem {
  offset: number;
  bytes: number;
  value: number;
  type?: string;
  name?: string;
  desc?: string;
}
export interface UItemBigInt {
  offset: number;
  bytes: number;
  value: bigint;
  type?: string;
  name?: string;
  desc?: string;
}

export interface ConstantInfo {
  name?: string,
  index: number,
  tag: UItem,
  name_index?: UItem,
  class_index?: UItem,
  name_and_type_index?: UItem,
  descriptor_index?: UItem,
  string_index?: UItem,
  reference_kind?: UItem,
  reference_index?: UItem,
  bootstrap_method_attr_index?: UItem,
  length?: UItem,
  bytes?: UItem | UItemBigInt,
}



export interface FlagItem {
  value: number,
  name: string,
  desc: string,
}

export type AccessFlags = Record<string, FlagItem>
