export const assert = (assertion: any, ...args: any[]) => {
  console.assert(Boolean(assertion), ...args)
}
