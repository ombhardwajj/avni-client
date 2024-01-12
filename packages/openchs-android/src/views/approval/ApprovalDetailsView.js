import Path from "../../framework/routing/Path";
import AbstractComponent from "../../framework/view/AbstractComponent";
import PropTypes from "prop-types";
import React from "react";
import General from "../../utility/General";
import CHSContent from "../common/CHSContent";
import AppHeader from "../common/AppHeader";
import {StyleSheet, Text, View} from "react-native";
import Distances from "../primitives/Distances";
import Observations from "../common/Observations";
import CHSContainer from "../common/CHSContainer";
import Colors from "../primitives/Colors";
import Styles from "../primitives/Styles";
import CHSNavigator from "../../utility/CHSNavigator";
import {
    ChecklistItem,
    Encounter,
    Individual,
    ProgramEncounter,
    ProgramEnrolment,
    WorkItem,
    WorkList,
    WorkLists,
} from 'avni-models';
import Reducers from "../../reducer";
import {ApprovalActionNames as Actions} from "../../action/approval/ApprovalActions";
import {ApprovalButton} from "./ApprovalButton";
import {ApprovalDialog} from "./ApprovalDialog";
import {RejectionMessage} from "./RejectionMessage";
import _ from 'lodash';
import Fonts from "../primitives/Fonts";
import FormMappingService from "../../service/FormMappingService";
import {ScrollView} from "native-base";
import UserInfoService from "../../service/UserInfoService";

@Path('/approvalDetailsView')
class ApprovalDetailsView extends AbstractComponent {
    static propTypes = {
        entity: PropTypes.object.isRequired
    };

    constructor(props, context) {
        super(props, context, Reducers.reducerKeys.approval);
        this.scrollRef = React.createRef();
    }

    viewName() {
        return 'ApprovalDetailsView';
    }

    UNSAFE_componentWillMount() {
        this.dispatchAction(Actions.ON_LOAD,{entity: this.props.entity, schema: this.props.entity.getSchemaName()});
        super.UNSAFE_componentWillMount();
    }

    renderDetails(entity) {
        const onDetailPress = () => CHSNavigator.navigateToIndividualRegistrationDetails(this, entity.individual.uuid, this.goBack.bind(this));
        return (
            <View style={styles.headerContainer}>
                <Text style={styles.headerTextStyle}>{entity.individual.nameString}</Text>
                <ApprovalButton
                    name={this.I18n.t('viewDetails')}
                    textColor={Colors.DarkPrimaryColor}
                    buttonColor={Colors.cardBackgroundColor}
                    onPress={onDetailPress}
                />
            </View>
        )
    }

    renderEntityDate(entity, I18n) {
        const createdBy = this.getService(UserInfoService).getCreatedBy(entity, this.I18n);
        const createdByMessage = _.isNil(createdBy) ? "" : I18n.t("by", {user: createdBy});
        const schemaToDatePropertyMap = {
            [Individual.schema.name]: {messageKey: I18n.t('registeredOn'), dateProperty: 'registrationDate'},
            [ProgramEnrolment.schema.name]: {messageKey: `${I18n.t('enrolmentDate')}: `, dateProperty: 'enrolmentDateTime'},
            [Encounter.schema.name]: {messageKey: `${I18n.t('encounterDate')}: `, dateProperty: 'encounterDateTime'},
            [ProgramEncounter.schema.name]: {messageKey: `${I18n.t('encounterDate')}: `, dateProperty: 'encounterDateTime'},
            [ChecklistItem.schema.name]: {messageKey: `${I18n.t('encounterDate')}: `, dateProperty: 'completionDate'}
        };
        const {messageKey, dateProperty} = schemaToDatePropertyMap[entity.getSchemaName()];

        return <Text
            style={styles.entityDateStyle}>{`${I18n.t(messageKey)}: ${General.toDisplayDate(entity[dateProperty])} ${createdByMessage}`}</Text>;
    }

    renderEditButton(entity) {
        const clonedEntity = entity.cloneForEdit();
        const schemaToActionMap = {
            [Individual.schema.name]: () => this.getNavigateToRegisterView(clonedEntity),
            [ProgramEnrolment.schema.name]: () => this.getNavigateToProgramEnrolmentView(clonedEntity),
            [Encounter.schema.name]: () => this.getNavigateToEncounterView(clonedEntity),
            [ProgramEncounter.schema.name]: () => this.getNavigateToEncounterView(clonedEntity),
            [ChecklistItem.schema.name]: () => CHSNavigator.navigateToChecklistItemView(this, clonedEntity)
        };
        return <View style={[styles.footerContainer, {alignSelf: 'flex-end'}]}>
            <ApprovalButton
                name={this.I18n.t('edit')}
                textColor={Colors.TextOnPrimaryColor}
                buttonColor={Colors.DarkPrimaryColor}
                onPress={schemaToActionMap[entity.getSchemaName()]}
                extraStyle={{paddingHorizontal: 50}}/>
        </View>
    }

    getNavigateToEncounterView(clonedEntity) {
        CHSNavigator.navigateToEncounterView(this, {
            encounter: clonedEntity,
            editing: true
        });
    }

    getNavigateToProgramEnrolmentView(clonedEntity) {
        CHSNavigator.navigateToProgramEnrolmentView(this, clonedEntity,
            new WorkLists(new WorkList('Enrolment', [new WorkItem(General.randomUUID(), WorkItem.type.PROGRAM_ENROLMENT,
                {subjectUUID: clonedEntity.individual.uuid, programName: clonedEntity.program.name,})])),
            true);
    }

    getNavigateToRegisterView(clonedEntity) {
        CHSNavigator.navigateToRegisterView(this,
            {
                workLists: new WorkLists(new WorkList(`${clonedEntity.subjectType.name} `,
                    [new WorkItem(General.randomUUID(),
                        WorkItem.type.REGISTRATION,
                        {uuid: clonedEntity.uuid, subjectTypeName: clonedEntity.subjectType.name})]))
            });
    }

    renderApproveAndRejectButtons(entity, I18n) {
        return (<View style={styles.footerContainer}>
            <ApprovalButton
                name={I18n.t('reject')}
                textColor={Colors.TextOnPrimaryColor}
                buttonColor={Colors.NegativeActionButtonColor}
                onPress={() => this.dispatchAction(Actions.ON_REJECT_PRESS, {entity, I18n})}
                extraStyle={{paddingHorizontal: 20}}/>
            <ApprovalButton
                name={I18n.t('approve')}
                textColor={Colors.TextOnPrimaryColor}
                buttonColor={Colors.DarkPrimaryColor}
                onPress={() => this.dispatchAction(Actions.ON_APPROVE_PRESS, {entity, I18n})}
                extraStyle={{paddingHorizontal: 20}}/>
        </View>)
    }

    getCancelOrExitObs(entity) {
        return _.isEmpty(entity.cancelObservations) ? entity.programExitObservations : entity.cancelObservations;
    }

    // TODO: the value for conditions in this method are interchanged. As for now, it has not caused issues since we are not doing much with the form. But need to fix it to avoid confusion.
    findForm(entity) {
        const service = this.getService(FormMappingService);
        const get = property => _.get(entity, property);
        switch (entity.getSchemaName()) {
            case(Individual.schema.name) :
                return service.findRegistrationForm(get('subjectType'));
            case(ProgramEnrolment.schema.name) :
                return _.isEmpty(entity.observations) ?
                    service.findFormForProgramEnrolment(get('program'), get('individual.subjectType')) :
                    service.findFormForProgramExit(get('program'), get('individual.subjectType'));
            case(Encounter.schema.name) :
                return _.isEmpty(entity.observations) ?
                    service.getIndividualEncounterForm(get('encounterType'), get('individual.subjectType')) :
                    service.getIndividualEncounterCancellationForm(get('encounterType'), get('individual.subjectType'));
            case(ProgramEncounter.schema.name) :
                return _.isEmpty(entity.observations) ?
                    service.getProgramEncounterForm(get('encounterType'), get('programEnrolment.program'), get('individual.subjectType')) :
                    service.findFormForCancellingEncounterType(get('encounterType'), get('programEnrolment.program'), get('individual.subjectType'));
            default :
                return null;
        }
    }

    render() {
        General.logDebug(this.viewName(), 'render');
        const entity = this.props.entity;
        const title = this.I18n.t('approvalDetailsTitle', {
            subjectName: entity.individual.nameString,
            entityName: entity.getName()
        });
        const approvalStatus = entity.latestEntityApprovalStatus.approvalStatus;
        const showApproveReject = approvalStatus.isPending && this.state.showApprovalButtons;
        const showEdit = approvalStatus.isRejected && this.state.showEditButton;
        const confirmActionName = this.state.showInputBox ? Actions.ON_REJECT : Actions.ON_APPROVE;
        const observations = _.isEmpty(entity.observations) ? this.getCancelOrExitObs(entity) : entity.observations;
        return (
            <CHSContainer>
                <CHSContent>
                    <ScrollView ref={this.scrollRef} keyboardShouldPersistTaps="handled">
                        <AppHeader title={title} hideIcon={true}/>
                        <RejectionMessage I18n={this.I18n} entityApprovalStatus={entity.latestEntityApprovalStatus}/>
                        <View style={styles.container}>
                            <View style={{flexDirection: 'column', marginHorizontal: Distances.ContentDistanceFromEdge}}>
                                {this.renderDetails(entity)}
                                {this.renderEntityDate(entity, this.I18n)}
                                <Observations
                                    observations={_.defaultTo(observations, [])}
                                    form={this.findForm(entity)}
                                />
                                {showApproveReject && this.renderApproveAndRejectButtons(entity, this.I18n)}
                                {showEdit && this.renderEditButton(entity)}
                            </View>
                        </View>
                    </ScrollView>
                    <ApprovalDialog
                      primaryButton={this.I18n.t('confirm')}
                      secondaryButton={this.I18n.t('cancel')}
                      onPrimaryPress={() => this.dispatchAction(confirmActionName, {
                          entity,
                          schema: entity.getSchemaName(),
                          cb: this.goBack.bind(this)
                      })}
                      onSecondaryPress={() => this.dispatchAction(Actions.ON_DIALOG_CLOSE)}
                      onClose={() => this.dispatchAction(Actions.ON_DIALOG_CLOSE)}
                      onInputChange={(value) => this.dispatchAction(Actions.ON_INPUT_CHANGE, {value})}
                      state={this.state}
                      I18n={this.I18n}/>
                </CHSContent>
            </CHSContainer>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: Styles.ContainerHorizontalDistanceFromEdge,
        marginTop: 10
    },
    headerContainer: {
        display: "flex",
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginVertical: 10,
    },
    footerContainer: {
        display: "flex",
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
    },
    headerTextStyle: {
        fontSize: Styles.titleSize,
        fontStyle: 'normal',
        color: Styles.blackColor,
        marginRight: 50
    },
    buttonContainer: {
        elevation: 2,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    entityDateStyle: {
        fontSize: Fonts.Medium,
        color: Colors.DefaultPrimaryColor
    }
});

export default ApprovalDetailsView;
