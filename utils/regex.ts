/* eslint-disable no-useless-escape */

export function removeContaintUrl(s: string) {
    return s
        .toLowerCase()
        .replace(/[ :\/]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
