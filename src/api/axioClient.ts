import axios from "axios";

const axioClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL +'/api',
    headers: {
        'Content-Type': 'application/json',
    }
})

export default axioClient;