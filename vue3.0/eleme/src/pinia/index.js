import { defineStore } from 'pinia';
import axios from 'axios'
export const useStore = defineStore('main', {
    // other options...
    state: () => {
        return {
            shopCarData: [],
            seller: [],
            ratings: []
        }
    },
    getters: {
        // getMyName: function
    },
    actions: {
        async initGoodsData(){
            const res = await axios('./data.json')
            this.shopCarData = res.data.goods
        },
        shopCarDataSet(data) {
            this.shopCarData = data
        },
        async initSellerData(){
            const res = await axios('./data.json')
            this.seller = res.data.seller
        },
        ratingsDataSet(data) {
            this.seller = data
        },
        async initRatingsData(){
            const res = await axios('./data.json')
            this.seller = res.data.ratings
        },
        ratingsDataSet(data) {
            this.ratings = data
        }
    }
})