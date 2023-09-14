import {Button, LogBox, SectionList, Text, View, StyleSheet} from "react-native";
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import FileSystem from "../src/model/FileSystem";
import GlobalContext from "../src/GlobalContext";
import AppStore from "../src/store/AppStore";
import RealmFactory from "../src/framework/db/RealmFactory";
import PersonRegisterActionsIntegrationTest from "./PersonRegisterActionsIntegrationTest";
import RNRestart from 'react-native-restart';
import DatabaseTest from "./DatabaseTest";
import IntegrationTestRunner, {IntegrationTests} from "./IntegrationTestRunner";

const styles = StyleSheet.create({
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
    },
    success: {
        backgroundColor: 'green',
        padding: 20,
        marginVertical: 8
    },
    failure: {
        backgroundColor: 'red',
        padding: 20,
        marginVertical: 8
    },
    header: {
        fontSize: 32,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
    },
});

class IntegrationTestApp extends Component {
    static childContextTypes = {
        getService: PropTypes.func.isRequired,
        getDB: PropTypes.func.isRequired,
        getStore: PropTypes.func.isRequired,
    };

    constructor(props, context) {
        super(props, context);
        FileSystem.init();
        this.getBean = this.getBean.bind(this);
        this.integrationTestRunner = new IntegrationTestRunner(DatabaseTest);
        this.state = {isInitialisationDone: false, integrationTests: this.integrationTestRunner.integrationTests};
    }

    getChildContext = () => ({
        getDB: () => GlobalContext.getInstance().db,
        getService: (serviceName) => {
            return GlobalContext.getInstance().beanRegistry.getService(serviceName);
        },
        getStore: () => GlobalContext.getInstance().reduxStore,
    });

    getBean(name) {
        return GlobalContext.getInstance().beanRegistry.getService(name);
    }

    async componentDidMount() {
        const globalContext = GlobalContext.getInstance();
        if (!globalContext.isInitialised()) {
            await globalContext.initialiseGlobalContext(AppStore, RealmFactory);
        }
        this.setState(state => ({...state, isInitialisationDone: true}));
    }

    render() {
        const {integrationTests} = this.state;
        const dataSource = _.map(_.groupBy(integrationTests.testMethods, (x) => x.className), (testMethods, className) => {
            return {title: className, data: testMethods};
        });

        LogBox.ignoreAllLogs();
        if (this.state.isInitialisationDone) {
            return <View style={{flex: 1, alignItems: 'center', justifyContent: "space-around", backgroundColor: "black", flexDirection: "column"}}>
                <SectionList
                    sections={dataSource}
                    keyExtractor={(x) => x.toString()}
                    renderItem={({item}) => {
                        console.log("IntegrationTestApp", item);
                        const itemStyle = _.isNil(item.successful) ? styles.item : (item.successful ? styles.success : styles.failure);
                        return <View style={itemStyle}>
                            <Text style={styles.title}>{item.methodName}</Text>
                        </View>
                    }
                    }
                    renderSectionHeader={({section: {title}}) => (
                        <Text style={styles.header}>{title}</Text>
                    )}
                />
                <Button title="Run Test" onPress={() => {
                    this.integrationTestRunner.run((x) => this.setState({integrationTests: x}));
                }}/>
                <Button title="Restart Test App" onPress={() => RNRestart.Restart()}/>
            </View>;
        }
        return <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', color: "white", backgroundColor: "black"}}>
            <Text>Loading...</Text>
        </View>;
    }
}

class IntegrationTestContext {
    static starting(testArguments) {
        console.log("Starting", testArguments.callee.name);
    }

    static ending(testArguments) {
        console.log("Ending", testArguments.callee.name);
    }
}

export default IntegrationTestApp;
