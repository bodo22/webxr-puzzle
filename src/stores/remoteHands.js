import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const ids = [...Array(2)].map((v, i) => i)
const calcXY = () => [(Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5]

const useRemoteHands = create(
  subscribeWithSelector((set) => ({
    items: ids,
    ...ids.reduce((acc, id) => ({ ...acc, [id]: calcXY() }), 0),
    advance() {
      // Set all coordinates randomly
      set((state) => {
        const coords = {}
        for (let i = 0; i < state.items.length; i++) coords[state.items[i]] = calcXY()
        return coords
      })
    },
  })),
)

export default useRemoteHands
