async function getFromP2P(){
    const response = await fetch('http://api.p2pquake.net/v2/jma/quake')
     const data = await response.json()
    return data
}