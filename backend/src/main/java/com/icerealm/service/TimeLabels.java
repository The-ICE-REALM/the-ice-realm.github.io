package com.icerealm.service;

/** Formats whole hours the way players say them: "7–8 pm", "11 am–12 pm". */
public final class TimeLabels {

    private TimeLabels() {
    }

    public static String range(int startHour, int endHour) {
        String startMeridiem = meridiem(startHour);
        String endMeridiem = meridiem(endHour);
        if (startMeridiem.equals(endMeridiem)) {
            return twelveHour(startHour) + "–" + twelveHour(endHour) + " " + endMeridiem;
        }
        return twelveHour(startHour) + " " + startMeridiem + "–" + twelveHour(endHour) + " " + endMeridiem;
    }

    public static String hour(int hour) {
        return twelveHour(hour) + " " + meridiem(hour);
    }

    private static String meridiem(int hour) {
        return hour % 24 < 12 ? "am" : "pm";
    }

    private static int twelveHour(int hour) {
        int h = hour % 12;
        return h == 0 ? 12 : h;
    }
}
