package main

import (
	"strings"
)

// Parser estructura del analizador sintáctico
type Parser struct {
	tokens   []Token
	position int
	language string
}

// NewParser crea un nuevo analizador sintáctico
func NewParser(tokens []Token, language string) *Parser {
	return &Parser{
		tokens:   tokens,
		position: 0,
		language: strings.ToLower(language),
	}
}

// Parse analiza la sintaxis y genera el árbol sintáctico
func (p *Parser) Parse() ([]ParseNode, []CompilerError) {
	var nodes []ParseNode
	var errors []CompilerError

	for p.position < len(p.tokens) {
		node, err := p.parseStatement()
		if err != nil {
			errors = append(errors, *err)
			p.advance() // Avanzar para evitar bucles infinitos
		} else if node != nil {
			nodes = append(nodes, *node)
		}
	}

	return nodes, errors
}

// parseStatement analiza una declaración
func (p *Parser) parseStatement() (*ParseNode, *CompilerError) {
	if p.position >= len(p.tokens) {
		return nil, nil
	}

	switch p.language {
	case "cpp", "javascript":
		return p.parseCStyleStatement()
	case "python":
		return p.parsePythonStatement()
	case "pascal":
		return p.parsePascalStatement()
	case "tsql", "plsql":
		return p.parseSQLStatement()
	case "html":
		return p.parseHTMLStatement()
	default:
		return p.parseGenericStatement()
	}
}

// parseCStyleStatement analiza declaraciones estilo C/JavaScript
func (p *Parser) parseCStyleStatement() (*ParseNode, *CompilerError) {
	if p.position >= len(p.tokens) {
		return nil, nil
	}

	token := p.tokens[p.position]

	// Declaración de función
	if token.Value == "function" || (p.position+1 < len(p.tokens) &&
		(token.Type == "KEYWORD" && (token.Value == "int" || token.Value == "void" || token.Value == "double"))) {
		return p.parseFunctionDeclaration()
	}

	// Declaración de variable
	if token.Value == "var" || token.Value == "let" || token.Value == "const" ||
		token.Value == "int" || token.Value == "double" || token.Value == "char" {
		return p.parseVariableDeclaration()
	}

	// Estructura de control
	if token.Value == "if" || token.Value == "while" || token.Value == "for" {
		return p.parseControlStructure()
	}

	// Expresión simple
	return p.parseExpression()
}

// parsePythonStatement analiza declaraciones de Python
func (p *Parser) parsePythonStatement() (*ParseNode, *CompilerError) {
	if p.position >= len(p.tokens) {
		return nil, nil
	}

	token := p.tokens[p.position]

	if token.Value == "def" {
		return p.parseFunctionDeclaration()
	}

	if token.Value == "class" {
		return p.parseClassDeclaration()
	}

	if token.Value == "if" || token.Value == "while" || token.Value == "for" {
		return p.parseControlStructure()
	}

	return p.parseExpression()
}

// parsePascalStatement analiza declaraciones de Pascal
func (p *Parser) parsePascalStatement() (*ParseNode, *CompilerError) {
	if p.position >= len(p.tokens) {
		return nil, nil
	}

	token := p.tokens[p.position]

	if token.Value == "program" {
		return p.parseProgramDeclaration()
	}

	if token.Value == "procedure" || token.Value == "function" {
		return p.parseFunctionDeclaration()
	}

	if token.Value == "var" {
		return p.parseVariableDeclaration()
	}

	if token.Value == "begin" {
		return p.parseBlock()
	}

	return p.parseExpression()
}

// parseSQLStatement analiza declaraciones SQL
func (p *Parser) parseSQLStatement() (*ParseNode, *CompilerError) {
	if p.position >= len(p.tokens) {
		return nil, nil
	}

	token := p.tokens[p.position]

	if token.Value == "select" {
		return p.parseSelectStatement()
	}

	if token.Value == "create" {
		return p.parseCreateStatement()
	}

	if token.Value == "insert" || token.Value == "update" || token.Value == "delete" {
		return p.parseDataManipulationStatement()
	}

	return p.parseExpression()
}

// parseHTMLStatement analiza elementos HTML
func (p *Parser) parseHTMLStatement() (*ParseNode, *CompilerError) {
	if p.position >= len(p.tokens) {
		return nil, nil
	}

	token := p.tokens[p.position]

	if token.Value == "<" {
		return p.parseHTMLElement()
	}

	return p.parseExpression()
}

// parseGenericStatement analiza declaraciones genéricas
func (p *Parser) parseGenericStatement() (*ParseNode, *CompilerError) {
	return p.parseExpression()
}

// Métodos auxiliares de parsing

func (p *Parser) parseFunctionDeclaration() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "FunctionDeclaration",
		Value:    "",
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	// Consumir palabra clave de función
	if p.position < len(p.tokens) {
		node.Value = p.tokens[p.position].Value
		p.advance()
	}

	// Nombre de la función
	if p.position < len(p.tokens) && p.tokens[p.position].Type == "IDENTIFIER" {
		nameNode := ParseNode{
			Type:   "Identifier",
			Value:  p.tokens[p.position].Value,
			Line:   p.tokens[p.position].Line,
			Column: p.tokens[p.position].Column,
		}
		node.Children = append(node.Children, nameNode)
		p.advance()
	}

	// Parámetros (simplificado)
	if p.position < len(p.tokens) && p.tokens[p.position].Value == "(" {
		p.advance() // (
		for p.position < len(p.tokens) && p.tokens[p.position].Value != ")" {
			p.advance()
		}
		if p.position < len(p.tokens) {
			p.advance() // )
		}
	}

	return node, nil
}

func (p *Parser) parseVariableDeclaration() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "VariableDeclaration",
		Value:    p.tokens[p.position].Value,
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance() // Consumir tipo/palabra clave

	// Nombre de variable
	if p.position < len(p.tokens) && p.tokens[p.position].Type == "IDENTIFIER" {
		nameNode := ParseNode{
			Type:   "Identifier",
			Value:  p.tokens[p.position].Value,
			Line:   p.tokens[p.position].Line,
			Column: p.tokens[p.position].Column,
		}
		node.Children = append(node.Children, nameNode)
		p.advance()
	}

	return node, nil
}

func (p *Parser) parseControlStructure() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "ControlStructure",
		Value:    p.tokens[p.position].Value,
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance() // Consumir palabra clave

	// Condición (simplificado)
	if p.position < len(p.tokens) && p.tokens[p.position].Value == "(" {
		p.advance() // (
		for p.position < len(p.tokens) && p.tokens[p.position].Value != ")" {
			p.advance()
		}
		if p.position < len(p.tokens) {
			p.advance() // )
		}
	}

	return node, nil
}

func (p *Parser) parseExpression() (*ParseNode, *CompilerError) {
	if p.position >= len(p.tokens) {
		return nil, nil
	}

	node := &ParseNode{
		Type:     "Expression",
		Value:    p.tokens[p.position].Value,
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance()
	return node, nil
}

func (p *Parser) parseClassDeclaration() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "ClassDeclaration",
		Value:    "class",
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance() // class

	if p.position < len(p.tokens) && p.tokens[p.position].Type == "IDENTIFIER" {
		nameNode := ParseNode{
			Type:   "Identifier",
			Value:  p.tokens[p.position].Value,
			Line:   p.tokens[p.position].Line,
			Column: p.tokens[p.position].Column,
		}
		node.Children = append(node.Children, nameNode)
		p.advance()
	}

	return node, nil
}

func (p *Parser) parseProgramDeclaration() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "ProgramDeclaration",
		Value:    "program",
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance() // program

	if p.position < len(p.tokens) && p.tokens[p.position].Type == "IDENTIFIER" {
		nameNode := ParseNode{
			Type:   "Identifier",
			Value:  p.tokens[p.position].Value,
			Line:   p.tokens[p.position].Line,
			Column: p.tokens[p.position].Column,
		}
		node.Children = append(node.Children, nameNode)
		p.advance()
	}

	return node, nil
}

func (p *Parser) parseBlock() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "Block",
		Value:    "begin",
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance() // begin

	for p.position < len(p.tokens) && p.tokens[p.position].Value != "end" {
		stmt, err := p.parseStatement()
		if err != nil {
			return node, err
		}
		if stmt != nil {
			node.Children = append(node.Children, *stmt)
		}
	}

	if p.position < len(p.tokens) {
		p.advance() // end
	}

	return node, nil
}

func (p *Parser) parseSelectStatement() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "SelectStatement",
		Value:    "select",
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance() // select

	// Simplificado: consumir hasta FROM o final
	for p.position < len(p.tokens) &&
		p.tokens[p.position].Value != "from" &&
		p.tokens[p.position].Value != ";" {
		p.advance()
	}

	return node, nil
}

func (p *Parser) parseCreateStatement() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "CreateStatement",
		Value:    "create",
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance() // create

	// Tipo de objeto (table, view, etc.)
	if p.position < len(p.tokens) {
		typeNode := ParseNode{
			Type:   "ObjectType",
			Value:  p.tokens[p.position].Value,
			Line:   p.tokens[p.position].Line,
			Column: p.tokens[p.position].Column,
		}
		node.Children = append(node.Children, typeNode)
		p.advance()
	}

	return node, nil
}

func (p *Parser) parseDataManipulationStatement() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "DataManipulationStatement",
		Value:    p.tokens[p.position].Value,
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	p.advance()
	return node, nil
}

func (p *Parser) parseHTMLElement() (*ParseNode, *CompilerError) {
	node := &ParseNode{
		Type:     "HTMLElement",
		Value:    "",
		Children: []ParseNode{},
		Line:     p.tokens[p.position].Line,
		Column:   p.tokens[p.position].Column,
	}

	if p.position < len(p.tokens) && p.tokens[p.position].Value == "<" {
		p.advance() // <

		if p.position < len(p.tokens) && p.tokens[p.position].Type == "IDENTIFIER" {
			node.Value = p.tokens[p.position].Value
			p.advance()
		}

		// Consumir hasta >
		for p.position < len(p.tokens) && p.tokens[p.position].Value != ">" {
			p.advance()
		}

		if p.position < len(p.tokens) {
			p.advance() // >
		}
	}

	return node, nil
}

// advance avanza la posición del parser
func (p *Parser) advance() {
	if p.position < len(p.tokens) {
		p.position++
	}
}

// peek mira el siguiente token sin avanzar
func (p *Parser) peek() *Token {
	if p.position+1 >= len(p.tokens) {
		return nil
	}
	return &p.tokens[p.position+1]
}
