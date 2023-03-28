import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from "./HomeScreen";
import TurfDescScreen from "./TurfDescScreen";
import TurfBookingDetailsScreen from "./TurfBookingDetailsScreen";
import TurfDescScreen2 from "./TurfDescScreen2";
import TurfDescScreen3 from "./TurfDescScreen3";
import TurfDescScreen4 from "./TurfDescScreen4";
import TurfDescScreen5 from "./TurfDescScreen5";
import TurfBookingDetailsScreen2 from "./TurfBookingDetailsScreen2";
import TurfBookingDetailsScreen3 from "./TurfBookingDetailsScreen3";
import TurfBookingDetailsScreen4 from "./TurfBookingDetailsScreen4";
import TurfBookingDetailsScreen5 from "./TurfBookingDetailsScreen5";
import PaymentGateway from "./PaymentGateway";
import transcID from "./transcID";
import PaymentStatus from "./paymentstatus";

export default function Route({navigation}){

    const Stack = createNativeStackNavigator();
    return (
        <Stack.Navigator>
            <Stack.Screen options={{ headerShown: false }} name="Home1" component={HomeScreen} />
            <Stack.Screen options={{ headerShown: false }} name="Turf1Description" component={TurfDescScreen} />
            <Stack.Screen options={{ headerShown: false }} name="Turf2Description" component={TurfDescScreen2} />
            <Stack.Screen options={{ headerShown: false }} name="Turf3Description" component={TurfDescScreen3} />
            <Stack.Screen options={{ headerShown: false }} name="Turf4Description" component={TurfDescScreen4} />
            <Stack.Screen options={{ headerShown: false }} name="Turf5Description" component={TurfDescScreen5} />
            <Stack.Screen options={{ headerShown: false }} name="Turf1Booking" component={TurfBookingDetailsScreen} />
            <Stack.Screen options={{ headerShown: false }} name="Turf2Booking" component={TurfBookingDetailsScreen2} />
            <Stack.Screen options={{ headerShown: false }} name="Turf3Booking" component={TurfBookingDetailsScreen3} />
            <Stack.Screen options={{ headerShown: false }} name="Turf4Booking" component={TurfBookingDetailsScreen4} />
            <Stack.Screen options={{ headerShown: false }} name="Turf5Booking" component={TurfBookingDetailsScreen5} />
            <Stack.Screen options={{ headerShown: false }} name="PaymentGateway" component={PaymentGateway} />
            <Stack.Screen options={{ headerShown: false }} name="transciD" component={transcID} />
            <Stack.Screen options={{ headerShown: false }} name="PaymentStatus" component={PaymentStatus} />

        </Stack.Navigator>
    );

}
