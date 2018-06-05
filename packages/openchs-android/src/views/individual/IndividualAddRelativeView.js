import {Button, View} from "react-native";
import React from "react";
import AbstractComponent from "../../framework/view/AbstractComponent";
import Path from "../../framework/routing/Path";
import Reducers from "../../reducer";
import {Actions} from "../../action/individual/IndividualAddRelativeActions";
import General from "../../utility/General";
import CHSContent from "../common/CHSContent";
import Styles from "../primitives/Styles";
import IndividualFormElement from "../form/formElement/IndividualFormElement";
import StaticFormElement from "../viewmodel/StaticFormElement";
import {IndividualRelative} from "openchs-models";
import _ from "lodash";
import RadioGroup, {RadioLabelValue} from "../primitives/RadioGroup";
import AppHeader from "../common/AppHeader";
import WizardButtons from "../common/WizardButtons";
import CHSContainer from "../common/CHSContainer";
import themes from "../primitives/themes";
import CHSNavigator from "../../utility/CHSNavigator";
import AbstractDataEntryState from "../../state/AbstractDataEntryState";

@Path('/individualAddRelative')
class IndividualAddRelativeView extends AbstractComponent {
    static propTypes = {
        individual: React.PropTypes.object
    };

    constructor(props, context) {
        super(props, context, Reducers.reducerKeys.individualAddRelative);
    }

    viewName() {
        return 'IndividualAddRelativeView';
    }

    componentDidMount() {
        this.dispatchOnLoad();
    }

    dispatchOnLoad() {
        setTimeout(() => this.dispatchAction(Actions.ON_LOAD, this.props), 200);
    }

    previous() {
        CHSNavigator.goBack(this);
    }

    save() {
        this.dispatchAction(Actions.SAVE, {
            cb: () => this.props.onSaveCallback(this),
        });
    }


    toggleRelation(relationUUID) {
        const selectedRelation = this.state.relations.find((relation) => relation.uuid === relationUUID);
        return this.dispatchAction(Actions.INDIVIDUAL_ADD_RELATIVE_SELECT_RELATION, {value: selectedRelation});
    }

    renderRelations() {
        const valueLabelPairs = this.state.relations.map(({uuid, name}) => new RadioLabelValue(name, uuid));
        return (
            <RadioGroup
                style={this.props.style}
                inPairs={true}
                onPress={({label, value}) => this.toggleRelation(value)}
                selectionFn={(relationUUID) => this.state.individualRelative.relation.uuid === relationUUID}
                labelKey='Relation'
                mandatory={true}
                labelValuePairs={valueLabelPairs}
                validationError={AbstractDataEntryState.getValidationError(this.state, IndividualRelative.validationKeys.RELATION)}
            />
        );

    }

    render() {
        General.logDebug(this.viewName(), 'render');
        const headerMessage = `${this.I18n.t(this.props.individual.nameString)} - ${this.I18n.t('addARelative')}`;
        return (
            <CHSContainer theme={themes}>
                <CHSContent>
                    <AppHeader title={headerMessage}/>
                    <View style={{
                        marginTop: Styles.ContentDistanceFromEdge,
                        paddingHorizontal: Styles.ContentDistanceFromEdge,
                        flexDirection: 'column'
                    }}>
                        <IndividualFormElement
                            individualNameValue={_.isNil(this.state.individualRelative.relative.name) ? "" : this.state.individualRelative.relative.name}
                            element={new StaticFormElement('Relative', true)}
                            inputChangeActionName={Actions.INDIVIDUAL_ADD_RELATIVE_SELECT_INDIVIDUAL}
                            validationResult={AbstractDataEntryState.getValidationError(this.state, IndividualRelative.validationKeys.RELATIVE)}
                        />
                        {this.renderRelations()}

                        <WizardButtons previous={{func: () => this.previous(), label: this.I18n.t('previous')}}
                                       next={{
                                           func: () => this.save(),
                                           label: this.I18n.t('save')
                                       }}
                                       style={{marginHorizontal: 24}}/>
                    </View>
                </CHSContent>
            </CHSContainer>
        );
    }
}

export default IndividualAddRelativeView;