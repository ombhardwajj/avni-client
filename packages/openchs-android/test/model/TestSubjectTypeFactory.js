import {SubjectType} from "openchs-models";
import General from "../../src/utility/General";

class TestSubjectTypeFactory {
    static createWithDefaults({type, name = General.randomUUID(), isGroup = false}) {
        const subjectType = new SubjectType();
        subjectType.uuid = General.randomUUID();
        subjectType.name = name;
        subjectType.type = type;
        subjectType.group = isGroup;
        return subjectType;
    }
}

export default TestSubjectTypeFactory;