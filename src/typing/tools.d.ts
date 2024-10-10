declare namespace ITools {
  type FnAble<T, K = any[]> = (...args: K) => T;
  type ArrayAble<T> = T[] | T;
}
