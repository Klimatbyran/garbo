import axios from "axios";
import apiConfig from "../../config/api"
import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";
import { serviceAuthenticationBody } from "../types";
import { User } from "@prisma/client";

interface GithubUserinfo {
    login: string,
    avatar_url: string,
    name: string,
    email: string
}

class AuthService {
    async authorizeUser(code: string) {
    
        const accessTokenRes = await axios.post<{access_token: string}>("https://github.com/login/oauth/access_token", {
            client_id: apiConfig.githubClientId,
            client_secret: apiConfig.githubClientSecret,
            redirect_uri: apiConfig.githubRedirectUri,
            code
        }, {
            headers: {Accept: "application/json"}
        });
        
        const accessToken =  accessTokenRes.data.access_token;

        const userinfoRes = await axios.get<GithubUserinfo>("https://api.github.com/user", {
            headers: {
                Authorization: "Bearer " + accessToken,
                Accept: "application/vnd.github+json"
            }
        })

        const userinfo = userinfoRes.data;

        const isMember = await axios.get("https://api.github.com/orgs/" + apiConfig.githubOrganization + "/members/" + userinfo.login, {
            headers: {
                Authorization: "Bearer " + accessToken,
                Accept: "application/vnd.github+json"
            }
        })

        if(isMember.status !== 204) {
            throw new Error("User is not member of the organization");
        }

        const user = await prisma.user.upsert({
            where: {
                githubId: userinfo.login
            },
            update: {
                name: userinfo.login,
                displayName: userinfo.name ?? "",
                githubImageUrl: userinfo.avatar_url,
                email: userinfo.email ?? null,
            },
            create: {
                name: userinfo.login,
                displayName: userinfo.name ?? "",
                githubId: userinfo.login,
                githubImageUrl: userinfo.avatar_url,
                email: userinfo.email ?? null,
            }
        })   
        
        return this.createToken(user);
    }
    
    async authorizeService(serviceAuth: serviceAuthenticationBody) {
        if (serviceAuth.client_secret !== apiConfig.secret) {
            throw new Error("Invalid secret");
        }
        
        let user = await prisma.user.findFirst({
            where: {
                name: serviceAuth.client_id
            }
        })
        
        if(!user) {
          user = await prisma.user.upsert({
              where: {
                  name: serviceAuth.client_id
              },
              update: {
                  name: serviceAuth.client_id,
                  email: serviceAuth.client_id + "@klimatkollen.se",
                  bot: true
              },
              create: {
                  name: serviceAuth.client_id,
                  email: serviceAuth.client_id + "@klimatkollen.se",
                  bot: true
              }
          })
        }
        
        return this.createToken(user);
    }

    private static readonly TOKEN_EXPIRY_BUFFER_MINUTES = 15;
    private static readonly SECONDS_IN_A_MINUTE = 60;

    verifyToken(token: string) {
        const userPayload = jwt.verify(token, apiConfig.jwtSecret) as User & {exp: number};
        if (!userPayload.email && !userPayload.githubId) {
            throw new Error("Invalid token: No email or GitHub ID present");
        }
        const currentTimeInSeconds = Date.now() / 1000;
        const renewalThreshold = AuthService.TOKEN_EXPIRY_BUFFER_MINUTES * AuthService.SECONDS_IN_A_MINUTE;

        const shouldRenew = currentTimeInSeconds > userPayload.exp - renewalThreshold;

        const {exp, ...user} = userPayload;
        return {
            user, 
            newToken: shouldRenew ? this.createToken(user) : undefined
        }
    }

    createToken(payload: User) {
       return jwt.sign(payload, apiConfig.jwtSecret, {expiresIn: apiConfig.jwtExpiresIn});
    }
}

export const authService = new AuthService()