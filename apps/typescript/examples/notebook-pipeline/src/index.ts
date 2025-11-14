/**
 * Notebook Pipeline Example
 *
 * This example demonstrates how to process Jupyter notebooks using the
 * nbformat library with the Effect-based processing pipeline.
 */

import { Effect } from "effect";
import { visit } from "unist-util-visit";
import { Processor } from "ndoctrinate-core";
import {
  NbformatParser,
  NbformatCompiler,
  type NotebookRoot,
  type CodeCell,
  type MarkdownCell,
  isCodeCell,
  isMarkdownCell,
  isStreamOutput,
  codeCell,
  markdownCell,
  pythonNotebook,
  streamOutput,
} from "ndoctrinate-nbformat";

/**
 * Example 1: Clear all notebook outputs
 */
function clearOutputsExample() {
  console.log("=".repeat(70));
  console.log("Example 1: Clear All Outputs");
  console.log("=".repeat(70));

  const notebook = pythonNotebook([
    markdownCell("# Data Analysis"),
    codeCell('print("Hello from Jupyter!")', [streamOutput("Hello from Jupyter!\n")], {
      executionCount: 1,
    }),
    codeCell("import pandas as pd\ndf = pd.DataFrame({'a': [1, 2, 3]})\ndf", [], {
      executionCount: 2,
    }),
  ]);

  console.log("\nOriginal notebook has code cells with outputs");
  console.log(`Total cells: ${notebook.children.length}`);

  let outputCount = 0;
  visit(notebook, "codeCell", (node: CodeCell) => {
    outputCount += node.children.length;
  });
  console.log(`Total outputs: ${outputCount}`);

  // Clear all outputs
  visit(notebook, "codeCell", (node: CodeCell) => {
    node.children = [];
    node.data.executionCount = null;
  });

  outputCount = 0;
  visit(notebook, "codeCell", (node: CodeCell) => {
    outputCount += node.children.length;
  });
  console.log(`\nAfter clearing:`);
  console.log(`Total outputs: ${outputCount}`);
  console.log("✓ All outputs cleared\n");
}

/**
 * Example 2: Extract code to Python script
 */
async function extractCodeExample() {
  console.log("=".repeat(70));
  console.log("Example 2: Extract Code to Python Script");
  console.log("=".repeat(70));

  const notebook = pythonNotebook([
    markdownCell("# Setup"),
    codeCell("import numpy as np\nimport matplotlib.pyplot as plt"),
    markdownCell("## Data Processing"),
    codeCell("data = np.random.randn(100)\nprint(f'Mean: {data.mean()}')"),
    markdownCell("## Visualization"),
    codeCell("plt.hist(data)\nplt.show()"),
  ]);

  const codeBlocks: string[] = [];
  visit(notebook, "codeCell", (node: CodeCell) => {
    codeBlocks.push(node.data.source);
  });

  const pythonScript = codeBlocks.join("\n\n");

  console.log("\nExtracted Python code:");
  console.log("-".repeat(50));
  console.log(pythonScript);
  console.log("-".repeat(50));
  console.log(`\n✓ Extracted ${codeBlocks.length} code cells\n`);
}

/**
 * Example 3: Add documentation tags
 */
async function addTagsExample() {
  console.log("=".repeat(70));
  console.log("Example 3: Add Tags to Cells");
  console.log("=".repeat(70));

  const notebook = pythonNotebook([
    markdownCell("# Introduction\n\nThis notebook demonstrates data analysis."),
    codeCell("# Setup code\nimport pandas as pd"),
    markdownCell("## Analysis\n\nWe'll analyze the data."),
    codeCell("# Analysis code\ndf.describe()"),
  ]);

  // Add tags to markdown cells
  let markdownCount = 0;
  visit(notebook, "markdownCell", (node: MarkdownCell) => {
    if (!node.data.metadata) {
      node.data.metadata = {};
    }
    if (!node.data.metadata.tags) {
      node.data.metadata.tags = [];
    }
    (node.data.metadata.tags as string[]).push("documentation");
    markdownCount++;
  });

  // Add tags to code cells
  let codeCount = 0;
  visit(notebook, "codeCell", (node: CodeCell) => {
    if (!node.data.metadata) {
      node.data.metadata = {};
    }
    if (!node.data.metadata.tags) {
      node.data.metadata.tags = [];
    }
    (node.data.metadata.tags as string[]).push("code-cell");
    codeCount++;
  });

  console.log(`\n✓ Added tags to ${markdownCount} markdown cells`);
  console.log(`✓ Added tags to ${codeCount} code cells\n`);
}

/**
 * Example 4: Pipeline transformation
 */
async function pipelineExample() {
  console.log("=".repeat(70));
  console.log("Example 4: Full Pipeline Transformation");
  console.log("=".repeat(70));

  // Sample notebook JSON
  const notebookJson = JSON.stringify({
    cells: [
      {
        cell_type: "markdown",
        id: "intro",
        metadata: {},
        source: "# Machine Learning Experiment",
      },
      {
        cell_type: "code",
        id: "setup",
        execution_count: 1,
        metadata: {},
        outputs: [
          {
            output_type: "stream",
            name: "stdout",
            text: "Libraries loaded\n",
          },
        ],
        source: "import sklearn\nprint('Libraries loaded')",
      },
      {
        cell_type: "code",
        id: "model",
        execution_count: 2,
        metadata: {},
        outputs: [],
        source: "model = RandomForestClassifier()\nmodel.fit(X, y)",
      },
    ],
    metadata: {
      kernelspec: {
        name: "python3",
        display_name: "Python 3",
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  });

  // Create processor with parser and compiler
  const processor = new Processor(new NbformatParser(), new NbformatCompiler());

  // Process with tree inspection
  const [output, tree] = await Effect.runPromise(
    processor.processWithTree(notebookJson)
  );

  console.log("\nNotebook structure:");
  console.log(`- Total cells: ${tree.children.length}`);

  let codeCount = 0;
  let markdownCount = 0;
  visit(tree, (node) => {
    if (isCodeCell(node)) codeCount++;
    if (isMarkdownCell(node)) markdownCount++;
  });

  console.log(`- Code cells: ${codeCount}`);
  console.log(`- Markdown cells: ${markdownCount}`);

  // Transform: clear outputs
  visit(tree, "codeCell", (node: CodeCell) => {
    node.children = [];
    node.data.executionCount = null;
  });

  // Compile back to JSON
  const cleanedJson = await Effect.runPromise(
    new NbformatCompiler().compile(tree)
  );

  const cleanedNotebook = JSON.parse(cleanedJson);
  console.log(`\n✓ Cleared all outputs`);
  console.log(
    `✓ Result has ${cleanedNotebook.cells.length} cells with no outputs\n`
  );
}

/**
 * Example 5: Statistics and analysis
 */
async function analysisExample() {
  console.log("=".repeat(70));
  console.log("Example 5: Notebook Analysis");
  console.log("=".repeat(70));

  const notebook = pythonNotebook([
    markdownCell("# Data Science Project\n\nAnalysis of sales data."),
    codeCell("import pandas as pd\nimport numpy as np", [], { executionCount: 1 }),
    codeCell("df = pd.read_csv('sales.csv')", [], { executionCount: 2 }),
    markdownCell("## Exploratory Analysis"),
    codeCell("df.describe()", [], { executionCount: 3 }),
    codeCell("df.groupby('region').sum()", [], { executionCount: 4 }),
    markdownCell("## Visualization"),
    codeCell("plt.plot(df['date'], df['sales'])", [], { executionCount: 5 }),
    codeCell("plt.savefig('sales.png')", [], { executionCount: 6 }),
  ]);

  // Analyze notebook
  const stats = {
    totalCells: notebook.children.length,
    codeCells: 0,
    markdownCells: 0,
    totalCodeLines: 0,
    totalMarkdownChars: 0,
    importsUsed: new Set<string>(),
    executedCells: 0,
  };

  visit(notebook, (node) => {
    if (isCodeCell(node)) {
      stats.codeCells++;
      stats.totalCodeLines += node.data.source.split("\n").length;
      if (node.data.executionCount !== null) {
        stats.executedCells++;
      }

      // Extract imports
      const importMatches = node.data.source.match(/import\s+(\w+)/g);
      if (importMatches) {
        importMatches.forEach((imp) => {
          const lib = imp.replace("import ", "");
          stats.importsUsed.add(lib);
        });
      }
    } else if (isMarkdownCell(node)) {
      stats.markdownCells++;
      stats.totalMarkdownChars += node.value.length;
    }
  });

  console.log("\nNotebook Statistics:");
  console.log("-".repeat(50));
  console.log(`Total cells: ${stats.totalCells}`);
  console.log(`  - Code cells: ${stats.codeCells} (${stats.executedCells} executed)`);
  console.log(`  - Markdown cells: ${stats.markdownCells}`);
  console.log(`Total code lines: ${stats.totalCodeLines}`);
  console.log(`Total markdown chars: ${stats.totalMarkdownChars}`);
  console.log(`Libraries imported: ${Array.from(stats.importsUsed).join(", ")}`);
  console.log("-".repeat(50) + "\n");
}

/**
 * Main example runner
 */
async function main() {
  console.log("\n");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(15) + "Jupyter Notebook Pipeline Examples" + " ".repeat(18) + "║");
  console.log("╚" + "═".repeat(68) + "╝");
  console.log("\n");

  // Run examples
  clearOutputsExample();
  await extractCodeExample();
  await addTagsExample();
  await pipelineExample();
  await analysisExample();

  console.log("=".repeat(70));
  console.log("All examples completed successfully!");
  console.log("=".repeat(70));
  console.log("\n");
}

// Run the examples
main().catch(console.error);
