type PickNullable<T> = {
  [P in keyof T as null extends T[P] ? P : never]: T[P]
}

type PickNotNullable<T> = {
  [P in keyof T as null extends T[P] ? never : P]: T[P]
}

/**
 * Make nullable types optional. This is useful to make the PrismaClient database types easier to work with.
 * Source: https://stackoverflow.com/a/72165304
 */
export type OptionalNullable<T> = {
  [K in keyof PickNullable<T>]?: Exclude<T[K], null>
} & {
  [K in keyof PickNotNullable<T>]: T[K]
}
