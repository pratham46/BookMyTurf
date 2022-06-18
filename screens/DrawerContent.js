import React from 'react';
import {View, StyleSheet, ImageBackground} from 'react-native';
import {Avatar, Title, Caption, Drawer} from 'react-native-paper';
import {DrawerContent, DrawerContentScrollView, DrawerItem} from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../firebase';
import {useNavigation} from "@react-navigation/native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
export function DrawerContent1(props) {

    const navigation = useNavigation()
    const handleSignOut = () => {
        auth
            .signOut()
            .then(() => {
                navigation.navigate('Login')
            })
            .catch(error => alert(error.message))
    }
    return (

        <View style={{flex: 1,backgroundColor: 'rgba(0, 0, 0, 0.95)'}}>

            <DrawerContentScrollView {...props}>
                <View style={styles.drawerContent}>
                    <View style={styles.userInfoSection}>
                        <View style={{flexDirection: 'row', marginTop: 15}}>
                            <Avatar.Image
                                source={require('../assets/avatarimage.png')}
                                size={50}
                            />
                            <View style={{marginLeft: 15, flexDirection: 'column'}}>
                                <Title style={styles.title}>{auth.currentUser?.email}</Title>
                                <Caption style={styles.caption}>{auth.currentUser?.email}</Caption>
                                </View>
                        </View>
                    </View>
                    <Drawer.Section style={styles.drawerSection}>
                        <DrawerItem
                            icon={({color, size}) => (
                                <Ionicons name="home" color={"#298a3d"} size={size} />
                            )}
                            label="Home"
                            labelStyle={styles.label}
                            onPress={() => {
                                props.navigation.navigate('Home');
                            }}
                        />
                        <DrawerItem
                            icon={({color, size,}) => (
                                <FontAwesome5 name="info" color={"#298a3d"} size={size} style={{marginLeft: 5,}}/>
                            )}
                            label="Your Info"
                            labelStyle={styles.label}
                            onPress={() => {
                                props.navigation.navigate('YourInfo');
                            }}
                        />
                        <DrawerItem
                            icon={({color, size,}) => (
                                <FontAwesome5 name="user-alt" color={"#298a3d"} size={size} style={{marginLeft: -3,}}/>
                            )}
                            label="User"
                            labelStyle={styles.label}
                            onPress={() => {
                                props.navigation.navigate('UserDetails');
                            }}
                        />
                    </Drawer.Section>
                </View>
            </DrawerContentScrollView>

            <Drawer.Section style={styles.bottomDrawerSection}>
                <DrawerItem label="Sign Out" labelStyle={styles.label} onPress={handleSignOut} />
            </Drawer.Section>

        </View>


);
}
const styles = StyleSheet.create({
    drawerContent: {
        flex: 1,
    },
    userInfoSection: {
        paddingLeft: 20,
    },
    title: {
        color: '#298a3d',
        fontSize: 16,
        marginTop: 3,
        fontWeight: 'bold',
    },
    caption: {
        color: '#298a3d',
        fontSize: 14,
        lineHeight: 14,
    },
    row: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    section: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    paragraph: {
        fontWeight: 'bold',
        marginRight: 3,
    },
    drawerSection: {
        marginTop: 15,
    },
    bottomDrawerSection: {
        marginBottom: 15,
        borderTopColor: '#298a3d',
        borderTopWidth: 1,
    },
    preference: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    label: {
      color: '#298a3d',
      fontWeight: "bold",
      fontSize: 20,
    },
});
