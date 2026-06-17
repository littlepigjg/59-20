const seedrandom = require('seedrandom');
const crypto = require('crypto');

class RandomGenerator {
  constructor(seed = null, parentSeed = null, derivationRule = null) {
    this.setSeed(seed);
    this.parentSeed = parentSeed;
    this.derivationRule = derivationRule;
  }

  setSeed(seed) {
    if (seed !== null && seed !== undefined) {
      this.seed = seed;
      this.rng = seedrandom(seed.toString());
    } else {
      this.seed = Date.now();
      this.rng = seedrandom(this.seed.toString());
    }
  }

  getSeed() {
    return this.seed;
  }

  getParentSeed() {
    return this.parentSeed;
  }

  getDerivationRule() {
    return this.derivationRule;
  }

  random() {
    return this.rng();
  }

  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  randomFloat(min, max, decimal = 2) {
    const value = this.random() * (max - min) + min;
    return Number(value.toFixed(decimal));
  }

  randomChoice(array) {
    if (!array || array.length === 0) return null;
    return array[this.randomInt(0, array.length - 1)];
  }

  randomWeightedChoice(options, weights = []) {
    if (!options || options.length === 0) return null;

    if (weights.length === 0) {
      return this.randomChoice(options);
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this.random() * totalWeight;

    for (let i = 0; i < options.length; i++) {
      random -= weights[i] || 0;
      if (random <= 0) {
        return options[i];
      }
    }

    return options[options.length - 1];
  }

  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static hashSeed(input) {
    return crypto.createHash('sha256').update(input.toString()).digest('hex');
  }

  static deriveSeed(baseSeed, rule, index = 0) {
    const ruleStr = typeof rule === 'object' ? JSON.stringify(rule) : String(rule);
    const seedInput = `${baseSeed}|${ruleStr}|${index}`;
    return RandomGenerator.hashSeed(seedInput);
  }

  deriveChild(rule, index = 0) {
    const childSeed = RandomGenerator.deriveSeed(this.seed, rule, index);
    return new RandomGenerator(childSeed, this.seed, rule);
  }

  deriveChildren(rule, count) {
    const children = [];
    for (let i = 0; i < count; i++) {
      children.push(this.deriveChild(rule, i));
    }
    return children;
  }

  deriveNamedChildren(rules) {
    const children = {};
    rules.forEach((rule, index) => {
      const key = typeof rule === 'object' ? (rule.name || `child_${index}`) : String(rule);
      children[key] = this.deriveChild(rule, index);
    });
    return children;
  }

  static createSeededGenerator(seed) {
    return new RandomGenerator(seed);
  }

  static createRowGenerator(baseSeed, rowIndex) {
    const rowSeed = `${baseSeed}-row-${rowIndex}`;
    return new RandomGenerator(rowSeed);
  }

  static createDerivedGenerator(baseSeed, rule, index = 0) {
    const childSeed = RandomGenerator.deriveSeed(baseSeed, rule, index);
    return new RandomGenerator(childSeed, baseSeed, rule);
  }

  static createDerivedGenerators(baseSeed, rule, count) {
    const generators = [];
    for (let i = 0; i < count; i++) {
      generators.push(RandomGenerator.createDerivedGenerator(baseSeed, rule, i));
    }
    return generators;
  }
}

module.exports = RandomGenerator;
