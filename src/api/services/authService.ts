import axios from "axios";
import apiConfig from "../../config/api"
import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";

interface Userinfo {
    login: string,
    avatar_url: string,
    name: string,
    email: string
}

interface User {
    id: string,
    name: string,
    email: string,
    githubId: string | null,
    githubImageUrl: string | null
}

class AuthService {
    async authUser(code: string) {
    
        const accessTokenRes = await axios.post<{access_token: string}>("https://github.com/login/oauth/access_token", {
            client_id: apiConfig.githubClientId,
            client_secret: apiConfig.githubClientSecret,
            redirect_uri: apiConfig.githubRedirectUri,
            code
        }, {
            headers: {Accept: "application/json"}
        });
        
        const accessToken =  accessTokenRes.data.access_token;

        const userinfoRes = await axios.get<Userinfo>("https://api.github.com/user", {
            headers: {
                Authorization: "Bearer " + accessToken,
                Accept: "application/vnd.github+json"
            }
        })

        const userinfo = userinfoRes.data;

        const isMemeber = await axios.get("https://api.github.com/orgs/" + apiConfig.githubOrganization + "/members/" + userinfo.login, {
            headers: {
                Authorization: "Bearer " + accessToken,
                Accept: "application/vnd.github+json"
            }
        })

        if(isMemeber.status !== 204) {
            throw new Error("User is not member of the organization");
        }

        const user = await prisma.user.upsert({
            where: {
                githubId: userinfo.login
            },
            update: {
                name: userinfo.name,
                githubImageUrl: userinfo.avatar_url,
                email: userinfo.email
            },
            create: {
                name: userinfo.name,
                githubId: userinfo.login,
                githubImageUrl: userinfo.avatar_url,
                email: userinfo.email
            }
        })   
        
        return this.createToken(user);
    }

    private static readonly TOKEN_EXPIRY_BUFFER_MINUTES = 15;
    private static readonly SECONDS_IN_A_MINUTE = 60;

    verifyUser(token: string) {
        const payload = jwt.verify(token, apiConfig.jwtSecret) as User & {exp: number};
        const currentTimeInSeconds = Date.now() / 1000;
        const renewalThreshold = AuthService.TOKEN_EXPIRY_BUFFER_MINUTES * AuthService.SECONDS_IN_A_MINUTE;

        const shouldRenew = currentTimeInSeconds > payload.exp - renewalThreshold;

        return {
            user: payload, 
            newToken: shouldRenew ? this.createToken(payload) : undefined
        }
    }

    createToken(payload: User) {
       return jwt.sign(payload, apiConfig.jwtSecret, {expiresIn: parseInt(apiConfig.jwtExpiresIn)});
    }
}

export const authService = new AuthService()