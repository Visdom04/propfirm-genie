import CalculatorsSuite from './CalculatorsSuite';

/** @deprecated Use CalculatorsSuite directly from the tools page. */
export default function ToolsHub({ firms = [], initialFirm }) {
  return <CalculatorsSuite firms={firms} initialFirm={initialFirm} />;
}
