// Запуск пересборки сайта на Railway.
//
// Сайт статический: изменения в CMS попадают на него только со следующей сборкой.
// Поэтому админке нужна кнопка «Опубликовать на сайте» — она дёргает публичный
// GraphQL API Railway и просит пересобрать сервис web.
//
// Нужны три переменные окружения у сервиса cms:
//   RAILWAY_API_TOKEN   — токен аккаунта или проекта (создаётся в дашборде Railway)
//   WEB_SERVICE_ID      — id сервиса web
//   WEB_ENVIRONMENT_ID  — id окружения (production)
//
// Токены у Railway двух видов и ходят РАЗНЫМИ заголовками: проектный —
// `Project-Access-Token`, аккаунтный/командный — `Authorization: Bearer`. Какой
// именно завели, из значения не понять, поэтому пробуем проектный, а на отказ
// авторизации повторяем как аккаунтный. Сейчас в проекте стоит проектный токен.

const RAILWAY_API = 'https://backboard.railway.com/graphql/v2'

const DEPLOY_MUTATION = `
  mutation serviceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
    serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
  }
`

export type RebuildResult = { ok: true } | { ok: false; error: string }

export async function triggerSiteRebuild(): Promise<RebuildResult> {
  const token = process.env.RAILWAY_API_TOKEN
  const serviceId = process.env.WEB_SERVICE_ID
  const environmentId = process.env.WEB_ENVIRONMENT_ID

  if (!token || !serviceId || !environmentId) {
    return {
      ok: false,
      error:
        'Не заданы переменные RAILWAY_API_TOKEN, WEB_SERVICE_ID и WEB_ENVIRONMENT_ID у сервиса cms.',
    }
  }

  const body = JSON.stringify({
    query: DEPLOY_MUTATION,
    variables: { serviceId, environmentId },
  })

  const call = (headers: Record<string, string>) =>
    fetch(RAILWAY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    })

  type GraphQLResponse = { errors?: { message: string }[] }
  const isAuthError = (payload: GraphQLResponse) =>
    Boolean(payload.errors?.some((e) => /not authorized|unauthorized/i.test(e.message)))

  let res: Response
  let payload: GraphQLResponse
  try {
    res = await call({ 'Project-Access-Token': token })
    payload = res.ok ? ((await res.json()) as GraphQLResponse) : {}

    // Токен оказался не проектным — повторяем как аккаунтный/командный.
    if (!res.ok || isAuthError(payload)) {
      res = await call({ Authorization: `Bearer ${token}` })
      payload = res.ok ? ((await res.json()) as GraphQLResponse) : {}
    }
  } catch {
    return { ok: false, error: 'Railway не отвечает. Попробуйте ещё раз через минуту.' }
  }

  if (!res.ok) {
    return { ok: false, error: `Railway ответил ${res.status}. Проверьте токен доступа.` }
  }

  if (payload.errors?.length) {
    return { ok: false, error: payload.errors[0].message }
  }

  return { ok: true }
}
