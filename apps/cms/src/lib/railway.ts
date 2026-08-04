// Запуск пересборки сайта на Railway.
//
// Сайт статический: изменения в CMS попадают на него только со следующей сборкой.
// Поэтому админке нужна кнопка «Опубликовать на сайте» — она дёргает публичный
// GraphQL API Railway и просит пересобрать сервис web.
//
// ВАЖНО, почему тут не просто redeploy. Railpack кеширует слои по содержимому
// исходников: если с прошлой сборки в репозитории ничего не менялось, слой
// `pnpm --filter web build` берётся из кеша (билд отрабатывает за считанные
// секунды), в образ уезжает СТАРЫЙ `dist`, и свежий контент из CMS на сайт не
// попадает. Голый `serviceInstanceRedeploy` в этом случае бесполезен — сайт
// молча остаётся прежним.
//
// Поэтому публикация идёт в два шага:
//   1) `variableUpsert` пишет сервису web переменную CONTENT_REVISION с текущим
//      временем. Переменные входят в хеш сборки, так что кеш инвалидируется —
//      и Railway сам ставит деплой в очередь при изменении переменной.
//   2) Если шаг 1 почему-то не прошёл (нет projectId, отказ API) — фолбэк на
//      старый `serviceInstanceRedeploy`, чтобы кнопка хоть что-то сделала.
//
// Нужны переменные окружения у сервиса cms:
//   RAILWAY_API_TOKEN   — токен аккаунта или проекта (создаётся в дашборде Railway)
//   WEB_SERVICE_ID      — id сервиса web
//   WEB_ENVIRONMENT_ID  — id окружения (production)
//   RAILWAY_PROJECT_ID  — id проекта; Railway подставляет его сам, задавать не нужно
//
// Токены у Railway двух видов и ходят РАЗНЫМИ заголовками: проектный —
// `Project-Access-Token`, аккаунтный/командный — `Authorization: Bearer`. Какой
// именно завели, из значения не понять, поэтому пробуем проектный, а на отказ
// авторизации повторяем как аккаунтный. Сейчас в проекте стоит проектный токен.

const RAILWAY_API = 'https://backboard.railway.com/graphql/v2'

/** Переменная-«ревизия контента» у сервиса web: её значение ломает кеш сборки. */
const REVISION_VARIABLE = 'CONTENT_REVISION'

const VARIABLE_UPSERT_MUTATION = `
  mutation variableUpsert($input: VariableUpsertInput!) {
    variableUpsert(input: $input)
  }
`

const REDEPLOY_MUTATION = `
  mutation serviceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
    serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
  }
`

export type RebuildResult = { ok: true } | { ok: false; error: string }

type GraphQLResponse = { errors?: { message: string }[] }

const isAuthError = (payload: GraphQLResponse) =>
  Boolean(payload.errors?.some((e) => /not authorized|unauthorized/i.test(e.message)))

/**
 * Один вызов GraphQL. Пробует проектный заголовок, на отказ авторизации
 * повторяет как аккаунтный. Возвращает ошибку строкой или null при успехе.
 */
async function call(token: string, query: string, variables: unknown): Promise<string | null> {
  const body = JSON.stringify({ query, variables })
  const send = (headers: Record<string, string>) =>
    fetch(RAILWAY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    })

  let res: Response
  let payload: GraphQLResponse
  try {
    res = await send({ 'Project-Access-Token': token })
    payload = res.ok ? ((await res.json()) as GraphQLResponse) : {}

    // Токен оказался не проектным — повторяем как аккаунтный/командный.
    if (!res.ok || isAuthError(payload)) {
      res = await send({ Authorization: `Bearer ${token}` })
      payload = res.ok ? ((await res.json()) as GraphQLResponse) : {}
    }
  } catch {
    return 'Railway не отвечает. Попробуйте ещё раз через минуту.'
  }

  if (!res.ok) return `Railway ответил ${res.status}. Проверьте токен доступа.`
  if (payload.errors?.length) return payload.errors[0].message
  return null
}

export async function triggerSiteRebuild(): Promise<RebuildResult> {
  const token = process.env.RAILWAY_API_TOKEN
  const serviceId = process.env.WEB_SERVICE_ID
  const environmentId = process.env.WEB_ENVIRONMENT_ID
  const projectId = process.env.RAILWAY_PROJECT_ID

  if (!token || !serviceId || !environmentId) {
    return {
      ok: false,
      error:
        'Не заданы переменные RAILWAY_API_TOKEN, WEB_SERVICE_ID и WEB_ENVIRONMENT_ID у сервиса cms.',
    }
  }

  // Шаг 1: новая ревизия контента → кеш сборки инвалидируется, Railway сам
  // ставит деплой в очередь.
  if (projectId) {
    const error = await call(token, VARIABLE_UPSERT_MUTATION, {
      input: {
        projectId,
        environmentId,
        serviceId,
        name: REVISION_VARIABLE,
        value: new Date().toISOString(),
      },
    })
    if (!error) return { ok: true }
    console.warn(`[rebuild] не удалось обновить ${REVISION_VARIABLE}: ${error}`)
  }

  // Шаг 2 (фолбэк): обычный redeploy. Он может переиспользовать закешированную
  // сборку — тогда сайт останется прежним, поэтому это только запасной путь.
  const error = await call(token, REDEPLOY_MUTATION, { serviceId, environmentId })
  if (error) return { ok: false, error }

  return { ok: true }
}
