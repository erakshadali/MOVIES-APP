// Movies and TV shows share numeric ids (movie 550 and tv 550 are different
// titles), so every title is identified by media_type + id.
export const mediaTypeOf = (item) => item.media_type || 'movie'

export const itemKey = (item) => `${mediaTypeOf(item)}-${item.id}`

export const itemPath = (item) => `/${mediaTypeOf(item)}/${item.id}`

export const sameItem = (a, b) => a.id === b.id && mediaTypeOf(a) === mediaTypeOf(b)

// Only keep the fields the cards need — a full details object (cast, images,
// reviews, etc.) would bloat localStorage unnecessarily.
export function toSlimItem(item) {
  return {
    id: item.id,
    media_type: mediaTypeOf(item),
    title: item.title ?? item.name,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    release_date: item.release_date ?? item.first_air_date,
    genre_ids: item.genre_ids ?? item.genres?.map((g) => g.id) ?? [],
  }
}
