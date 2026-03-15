import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:5000"
})

export const getStocks = async () => {
  const res = await API.get("/stocks")
  return res.data
}

export const getPrediction = async (ticker: string) => {
  const res = await API.get(`/predict/${ticker}`)
  return res.data
}