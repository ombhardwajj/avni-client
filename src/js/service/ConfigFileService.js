import BaseService from './BaseService.js'
import Service from '../framework/bean/Service';
import ConfigFile from '../models/ConfigFile';
import BatchRequest from "../framework/http/BatchRequest";
import _ from 'lodash';
import SettingsService from "./SettingsService";
import MessageService from "./MessageService";

@Service("configFileService")
class ConfigFileService extends BaseService {
    constructor(db, beanStore) {
        super(db, beanStore);
        this.encounterDecisionFile = "encounterDecision.js";
        this.customMessageFile = "customMessages.json";
        this.individualRegistrationFile = "individualRegistrationDecision.js";
        this.programEnrolmentFile = "programEnrolmentDecision.js";
        this.programEncounterFile = "programEncounterDecision.js";
        this.programConfigFile = "programConfig.js";
        this._createFileHandlers();
    }

    saveConfigFile(fileName, contents) {
        const db = this.db;
        this.db.write(()=> db.create(ConfigFile.schema.name, ConfigFile.create(fileName, contents), true));
    }

    getEncounterDecisionFile() {
        return this.getFile(this.encounterDecisionFile);
    }

    getFile(fileName) {
        return this.db.objectForPrimaryKey(ConfigFile.schema.name, `${fileName.toLowerCase()}`);
    }

    getProgramEnrolmentFile() {
        return this.getFile(this.programEnrolmentFile);
    }

    getProgramEncounterFile() {
        return this.getFile(this.programEncounterFile);
    }

    getIndividualRegistrationFile() {
        return this.getFile(this.individualRegistrationFile);
    }

    getProgramConfigFile() {
        return this.getFile(this.programConfigFile);
    }

    getCustomMessages() {
        const configFile = this.db.objectForPrimaryKey(ConfigFile.schema.name, `${this.customMessageFile.toLowerCase()}`);
        return _.isNil(configFile) ? null : JSON.parse(configFile.contents);
    }

    _createFileHandlers() {
        this.fileHandlers = {};
        this.fileHandlers[`${this.encounterDecisionFile}`] = (response) => this.saveConfigFile(this.encounterDecisionFile, response);
        this.fileHandlers[`${this.individualRegistrationFile}`] = (response) => this.saveConfigFile(this.individualRegistrationFile, response);
        this.fileHandlers[`${this.programEnrolmentFile}`] = (response) => this.saveConfigFile(this.programEnrolmentFile, response);
        this.fileHandlers[`${this.programEncounterFile}`] = (response) => this.saveConfigFile(this.programEncounterFile, response);
        this.fileHandlers[`${this.programConfigFile}`] = (response) => this.saveConfigFile(this.programConfigFile, response);
        this.fileHandlers[`${this.customMessageFile}`] = (response) => {
            this.saveConfigFile(this.customMessageFile, response);
            const messageService = this.getService(MessageService);
            messageService.addTranslationsFrom(this.getCustomMessages());
        }
    }

    getAllFilesAndSave(cb, errorHandler) {
        const batchRequest = new BatchRequest();
        const configURL = `${this.getService(SettingsService).getSettings().serverURL}/ext`;

        _.forOwn(this.fileHandlers, (handler, file) => {
            batchRequest.add(`${configURL}/${file}`, handler, errorHandler);
        });
        batchRequest.fire(cb, errorHandler);
    }
}

export default ConfigFileService;