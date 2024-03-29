import Koa from 'koa'
import Router from 'koa-router'
import fetch from 'node-fetch'
import { isLumaTokenValid, getOAuthToken } from './auth.tokens'
import db from './db'

import * as GuildConfig from './interfaces/guild.config'

const LumaAPI = new Router({
    prefix: '/api'
})

/**
 * Middleware que verifica se o usuário fez a autenticação com OAuth2.
 */
const requiresAuth = async (ctx: Koa.Context, next: () => void) => {
    let lumaToken: string = ctx.cookies.get('token')

    if (await isLumaTokenValid(lumaToken)) return next()

    // Se não estiver autenticado, dar erro
    ctx.status = 401 // HTTP Unauthorized
    ctx.body = { 'erro': 401, 'msg': 'Usuário não autenticado' }
}

// Retorna o usuário autenticado atualmente
LumaAPI.get('/currentUser', requiresAuth, async (ctx: Koa.Context) => {
    let oauthToken: string = await getOAuthToken(ctx.cookies.get('token'))

    let resp = 
        await fetch(`https://discordapp.com/api/users/@me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${oauthToken}`
            }
        }).then(r => r.json())

    ctx.body = resp
})

// Retorna as guilds do usuário autenticado
LumaAPI.get('/userGuilds', requiresAuth, async (ctx: Koa.Context) => {
    let oauthToken: string = await getOAuthToken(ctx.cookies.get('token'))

    let resp = 
        await fetch(`https://discordapp.com/api/users/@me/guilds`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${oauthToken}`
            }
        }).then(r => r.json())

    ctx.body = resp
})

// Retorna a configuração salva para uma guild
LumaAPI.get('/guild/:id', requiresAuth, async (ctx: Koa.Context) => {
    let id: string = ctx.params.id

    let data: GuildConfig.GuildConfig = await db().get(`
        SELECT * FROM guild_conf WHERE guild_id = ?
    `, id)

    ctx.body = Object.assign(GuildConfig.defaults(id), data)
})

export default LumaAPI