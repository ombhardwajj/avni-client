import {View, StyleSheet} from "react-native";
import PropTypes from 'prop-types';
import React, {Component} from "react";
import AbstractComponent from "../../framework/view/AbstractComponent";
import DGS from "./DynamicGlobalStyles";
import {Text, Grid, Row, Radio} from "native-base";
import Colors from '../primitives/Colors';
import PresetOptionItem from "./PresetOptionItem";
import Distances from "./Distances";
import Styles from "./Styles";
import _ from 'lodash';
import ValidationErrorMessage from "../form/ValidationErrorMessage";


export class RadioLabelValue {
    constructor(label, value, abnormal) {
        this.label = label;
        this.value = value;
        this.abnormal = abnormal;
    }
}

class RadioGroup extends AbstractComponent {
    static defaultProps = {
        style: {},
        borderStyle: {},
        inPairs: false,
        multiSelect: false,
        disabled: false,
        skipLabel: false
    };

    static propTypes = {
        onPress: PropTypes.func.isRequired,
        labelKey: PropTypes.string.isRequired,
        labelValuePairs: PropTypes.array.isRequired,
        selectionFn: PropTypes.func.isRequired,
        validationError: PropTypes.object,
        style: PropTypes.object,
        borderStyle: PropTypes.object,
        mandatory: PropTypes.bool,
        inPairs: PropTypes.bool,
        multiSelect: PropTypes.bool,
        skipLabel: PropTypes.bool,
    };

    constructor(props, context) {
        super(props, context);
    }

    renderPairedOptions() {
        return _.chunk(this.props.labelValuePairs, 2).map((rlvPair, idx) =>
            <View style={{flexDirection: "row", justifyContent: "space-between"}} key={idx}>
                {rlvPair.map((rlv) =>
                    <PresetOptionItem displayText={this.I18n.t(rlv.label)}
                                      checked={this.props.selectionFn(rlv.value)}
                                      abnormal={rlv.abnormal}
                                      multiSelect={this.props.multiSelect}
                                      chunked={true}
                                      validationResult={this.props.validationError}
                                      onPress={() => this.props.onPress(rlv)}
                                      key={rlv.label}
                                      style={{
                                          paddingVertical: Distances.VerticalSpacingBetweenOptionItems,
                                          paddingRight: Distances.HorizontalSpacingBetweenOptionItems
                                      }}
                                      disabled={this.props.disabled}
                                      value={rlv.value}/>
                )}
            </View>);
    }

    renderOptions() {
        return this.props.labelValuePairs.map(radioLabelValue =>
            <PresetOptionItem displayText={this.I18n.t(radioLabelValue.label)}
                              checked={this.props.selectionFn(radioLabelValue.value)}
                              multiSelect={this.props.multiSelect}
                              validationResult={this.props.validationError}
                              onPress={() => this.props.onPress(radioLabelValue)}
                              key={radioLabelValue.label}
                              style={{
                                  paddingVertical: Distances.VerticalSpacingBetweenOptionItems,
                                  paddingRight: Distances.HorizontalSpacingBetweenOptionItems
                              }}
                              disabled={this.props.disabled}
                              value={radioLabelValue.value}
            />)
    }

    renderSingleValue() {
        const radioLabelValue = _.head(this.props.labelValuePairs);
        if (!this.props.selectionFn(radioLabelValue.value)) {
            this.props.onPress(radioLabelValue);
        }
        return (
            <Text style={Styles.formLabel}>{radioLabelValue.label}</Text>
        )
    }

    render() {
        const mandatoryText = this.props.mandatory ? <Text style={{color: Colors.ValidationError}}> * </Text> : <Text/>;
        const selectedValue = _.find(this.props.labelValuePairs, (x) => this.props.selectionFn(x.value));
        return (
            <View style={this.appendedStyle({})}>
                {!this.props.skipLabel &&
                <Text style={Styles.formLabel}>{this.I18n.t(this.props.labelKey)}{mandatoryText}</Text>}
                {this.props.labelValuePairs.length > 0 ? this.props.labelValuePairs.length === 1 && this.props.mandatory === true ?
                    <View style={[style.radioStyle, this.props.borderStyle]}>
                        {this.renderSingleValue()}
                    </View> :
                    <Radio.Group accessibilityLabel={this.props.labelKey} style={[style.radioStyle, this.props.borderStyle]}
                                 value={selectedValue && selectedValue.value} onChange={newValue => this.props.onPress(newValue)}>
                        {this.props.inPairs ? this.renderPairedOptions() : this.renderOptions()}
                    </Radio.Group> : <View/>}
                <View style={{backgroundColor: '#ffffff'}}>
                    <ValidationErrorMessage validationResult={this.props.validationError}/>
                </View>
            </View>
        );
    }
}

export default RadioGroup;
const style = StyleSheet.create({
    radioStyle: {
        borderWidth: 1,
        borderRadius: 1,
        borderStyle: 'dashed',
        borderColor: Colors.InputBorderNormal,
        paddingHorizontal: Distances.ScaledContentDistanceFromEdge,
        paddingBottom: Distances.ScaledVerticalSpacingBetweenOptionItems,
    }
})
