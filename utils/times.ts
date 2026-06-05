import { addMinutes, addHours, addDays } from 'date-fns'

export const dateUtils = {
    now(): Date {
        return new Date()
    },

    // Minutes
    addOneMinutes(): Date {
        return addMinutes(new Date(), 1)
    },
    addFifteenMinutes(): Date {
        return addMinutes(new Date(), 15)
    },
    addThirtyMinutes(): Date {
        return addMinutes(new Date(), 30)
    },

    // Hours
    addOneHour(): Date {
        return addHours(new Date(), 1)
    },
    addTwentyFourHours(): Date {
        return addHours(new Date(), 24)
    },

    // Days
    addOneDay(): Date {
        return addDays(new Date(), 1)
    },
    addThreeDay(): Date {
        return addDays(new Date(), 3)
    },
    addSevenDays(): Date {
        return addDays(new Date(), 7)
    },
    addThirtyDays(): Date {
        return addDays(new Date(), 30)
    },

    // Days Number
    addSevenDaysUseNumber(): number {
        return 7 * 24 * 60 * 60 * 1000
    }
}
