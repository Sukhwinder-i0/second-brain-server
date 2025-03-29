export const generateRandom =(len: number) => {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let ans = ""
    let charsLen = chars.length;
    for(let i=0; i<len; i++) 
        ans += chars[Math.floor(Math.random() * charsLen)]

    return ans
}
